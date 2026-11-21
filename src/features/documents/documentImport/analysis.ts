import { FileSystem } from 'react-native-file-access';
import { fallbackHealthExtraction } from '../../../api/healthExtraction';
import {
  DuplicateCancelledError,
  askDuplicateAction,
  duplicateDetails,
} from './duplicatePrompt';
import { documentsApi } from '../../../api/documents.api';
import type { DocumentAnalysisResponse } from '../../../api/types';
import { encryptDocumentForUpload } from '../../../security/documentEncryption';
import { MAX_DOCUMENT_SIZE_BYTES } from '../../../security/documentLimits';
import { toFileUri } from './filePolicy';
import type { SelectedDocument } from './types';

async function removeIfPresent(path: string | undefined) {
  if (path && (await FileSystem.exists(path))) {
    await FileSystem.unlink(path).catch(() => undefined);
  }
}

const filesOf = (selected: SelectedDocument) => selected.pages ?? [selected];

export class DocumentImportCancelledError extends Error {
  constructor() {
    super('Document upload was cancelled.');
    this.name = 'DocumentImportCancelledError';
  }
}

export type DocumentImportStage = 'encrypting' | 'extracting';

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DocumentImportCancelledError();
}

export async function discardSelectedDocument(selected: SelectedDocument) {
  for (const file of filesOf(selected)) {
    if (file.path && (await FileSystem.exists(file.path))) {
      await FileSystem.unlink(file.path);
    }
  }
}

/** Groups the picked files into one multi-page document. */
export function combineSelectedDocuments(
  files: SelectedDocument[],
): SelectedDocument {
  return { ...files[0]!, pages: files };
}

/** Encrypts the selection on-device and uploads it for analysis. Always cleans up local copies. */
async function analyzeWithHealthFallback(
  upload: () => Promise<DocumentAnalysisResponse>,
) {
  const analysis = await upload();
  if (analysis.document.healthExtraction) return analysis;
  const healthExtraction = fallbackHealthExtraction(analysis.document);
  return healthExtraction
    ? { ...analysis, document: { ...analysis.document, healthExtraction } }
    : analysis;
}

export async function analyzeSelectedDocument(
  selected: SelectedDocument,
  aiAnalysisConsent: boolean,
  signal?: AbortSignal,
  onStage?: (stage: DocumentImportStage) => void,
): Promise<DocumentAnalysisResponse> {
  const sources = filesOf(selected);
  const encrypted: Array<Awaited<ReturnType<typeof encryptDocumentForUpload>>> =
    [];
  try {
    throwIfAborted(signal);
    onStage?.('encrypting');
    const [stats, key] = await Promise.all([
      Promise.all(sources.map(source => FileSystem.stat(source.path))),
      documentsApi.getEncryptionKey(),
    ]);
    let totalBytes = 0;
    for (const { size } of stats) {
      if (size > MAX_DOCUMENT_SIZE_BYTES) {
        throw new Error('Choose a file smaller than 10 MB.');
      }
      totalBytes += size;
    }
    const encryptionStartedAt = Date.now();
    for (const source of sources) {
      throwIfAborted(signal);
      encrypted.push(
        await encryptDocumentForUpload(
          source.path,
          source.fileName,
          source.mimeType,
          key,
          aiAnalysisConsent,
        ),
      );
    }
    if (__DEV__) {
      console.debug(
        `[documents] encrypted ${sources.length} file(s), ${totalBytes} bytes in ${Date.now() - encryptionStartedAt}ms`,
      );
    }
    throwIfAborted(signal);
    onStage?.('extracting');
    const upload = () =>
      analyzeWithHealthFallback(() =>
        documentsApi.analyzeEncrypted(
          encrypted.map(item => ({
            uri: toFileUri(item.path),
            name: 'encrypted-document',
          })),
          encrypted.map(item => item.envelope),
          signal,
        ),
      );
    const analysisStartedAt = Date.now();
    try {
      const result = await upload();
      if (__DEV__) {
        console.debug(
          `[documents] upload and analysis completed in ${Date.now() - analysisStartedAt}ms`,
        );
      }
      return result;
    } catch (error) {
      if (signal?.aborted) throw new DocumentImportCancelledError();
      // The server rejects an identical file at analysis time; offer to replace the existing one.
      const duplicate = duplicateDetails(error);
      if (!duplicate?.id) throw error;
      if (
        (await askDuplicateAction(duplicate, selected.fileName)) !== 'replace'
      ) {
        throw new DuplicateCancelledError();
      }
      await documentsApi.delete(duplicate.id);
      return await upload();
    }
  } finally {
    await Promise.all(encrypted.map(item => removeIfPresent(item.path)));
    await Promise.all(sources.map(source => removeIfPresent(source.path)));
  }
}
