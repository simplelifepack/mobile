import { FileSystem } from 'react-native-file-access';
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

export const discardSelectedDocument = (selected: SelectedDocument) =>
  removeIfPresent(selected.path);

/** Encrypts the selection on-device and uploads it for analysis. Always cleans up local copies. */
export async function analyzeSelectedDocument(
  selected: SelectedDocument,
  aiAnalysisConsent: boolean,
): Promise<DocumentAnalysisResponse> {
  let encryptedPath: string | undefined;
  try {
    const { size } = await FileSystem.stat(selected.path);
    if (size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new Error('Choose a file smaller than 10 MB.');
    }
    const key = await documentsApi.getEncryptionKey();
    const encrypted = await encryptDocumentForUpload(
      selected.path,
      selected.fileName,
      selected.mimeType,
      key,
      aiAnalysisConsent,
    );
    encryptedPath = encrypted.path;
    return await documentsApi.analyzeEncrypted(
      [{ uri: toFileUri(encryptedPath), name: 'encrypted-document' }],
      [encrypted.envelope],
    );
  } finally {
    await removeIfPresent(encryptedPath);
    await removeIfPresent(selected.path);
  }
}
