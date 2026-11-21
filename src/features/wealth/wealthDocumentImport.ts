import { Alert } from 'react-native';

import { documentsApi } from '../../api/documents.api';
import type { DocumentAnalysisResponse } from '../../api/types';
import {
  analyzeSelectedDocument,
  captureDocumentPhoto,
  DocumentImportCancelledError,
  type DocumentImportStage,
  selectDocumentFile,
  selectImageFromGallery,
  startConsentedImport,
  type SelectedDocument,
} from '../documents/documentImport';

export type SavedWealthDocument = {
  id: string;
  title: string;
  analysis: DocumentAnalysisResponse['document'];
};

export async function saveSelectedDocument(
  selected: SelectedDocument,
  aiConsent: boolean,
  signal?: AbortSignal,
  onStage?: (stage: DocumentImportStage) => void,
  onPersisting?: () => void,
): Promise<SavedWealthDocument> {
  const analysis = await analyzeSelectedDocument(
    selected,
    aiConsent,
    signal,
    onStage,
  );
  if (signal?.aborted) throw new DocumentImportCancelledError();
  onPersisting?.();
  const doc = analysis.document;
  const saved = await documentsApi.save({
    tempFileIds: analysis.files.map(file => file.tempFileId),
    originalName: analysis.files[0]?.originalName,
    mimeType: analysis.files[0]?.mimeType,
    size: analysis.files.reduce((sum, file) => sum + file.size, 0),
    title:
      doc.title?.trim() || analysis.files[0]?.originalName || selected.fileName,
    category: doc.category?.trim() || 'Other',
    documentType: doc.documentType?.trim() || 'Unknown',
    confidence: Number(doc.confidence) || 0,
    fields: doc.fields ?? {},
    reviewFields: doc.reviewFields ?? [],
    rawExtractedText: doc.rawExtractedText ?? '',
    warnings: analysis.warnings ?? [],
    evidence: doc.evidence ?? [],
    analysisSource: aiConsent ? 'ai' : 'rules',
    duplicateAction: 'keep_both',
    owner: 'self',
    userConfirmedUnknown: true,
    verified: false,
  });
  return {
    id: saved.document.id,
    title: saved.document.displayName ?? saved.document.title ?? doc.title,
    analysis: doc,
  };
}

export function pickAndSaveDocument(
  onSaved: (document: SavedWealthDocument) => void,
  onStart: (selected: SelectedDocument, cancel: () => void) => void,
  onEnd: (cancelled: boolean) => void,
  onError?: (error: unknown) => void,
  onStage?: (stage: DocumentImportStage) => void,
  onPersisting?: () => void,
) {
  const processDocument = async (
    selected: SelectedDocument,
    aiConsent: boolean,
  ) => {
    const controller = new AbortController();
    onStart(selected, () => controller.abort());
    try {
      onSaved(
        await saveSelectedDocument(
          selected,
          aiConsent,
          controller.signal,
          onStage,
          onPersisting,
        ),
      );
    } catch (error) {
      if (
        !controller.signal.aborted &&
        !(error instanceof DocumentImportCancelledError)
      ) {
        if (onError) {
          onError(error);
        } else {
          Alert.alert(
            'Unable to add document',
            error instanceof Error ? error.message : 'Please try again.',
          );
        }
      }
    } finally {
      onEnd(controller.signal.aborted);
    }
  };
  const run = (select: () => Promise<SelectedDocument | undefined>) =>
    startConsentedImport({ select, onConsent: processDocument });

  return [
    { label: 'Choose file', onPress: () => run(selectDocumentFile) },
    { label: 'Photo library', onPress: () => run(selectImageFromGallery) },
    { label: 'Camera', onPress: () => run(captureDocumentPhoto) },
  ];
}

export function documentAmount(analysis: SavedWealthDocument['analysis']) {
  const fields = analysis.fields ?? {};
  for (const key of ['amount', 'totalAmount', 'principalAmount', 'value']) {
    const value = fields[key];
    if (
      (typeof value === 'string' && value.trim()) ||
      typeof value === 'number'
    ) {
      return String(value).replace(/[^\d.]/g, '');
    }
  }
  return '';
}
