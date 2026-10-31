import { Alert } from 'react-native';

import { documentsApi } from '../../api/documents.api';
import type { DocumentAnalysisResponse } from '../../api/types';
import {
  analyzeSelectedDocument,
  captureDocumentPhoto,
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
): Promise<SavedWealthDocument> {
  const analysis = await analyzeSelectedDocument(selected, aiConsent);
  const doc = analysis.document;
  const saved = await documentsApi.save({
    tempFileIds: analysis.files.map(file => file.tempFileId),
    title: doc.title,
    category: doc.category,
    documentType: doc.documentType,
    confidence: doc.confidence,
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
  onStart: () => void,
  onEnd: () => void,
) {
  const processDocument = async (selected: SelectedDocument, aiConsent: boolean) => {
    onStart();
    try {
      onSaved(await saveSelectedDocument(selected, aiConsent));
    } catch (error) {
      Alert.alert(
        'Unable to add document',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      onEnd();
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
    if ((typeof value === 'string' && value.trim()) || typeof value === 'number') {
      return String(value).replace(/[^\d.]/g, '');
    }
  }
  return '';
}
