import { saveDocumentWithDuplicatePrompt } from '../documents/documentImport/duplicatePrompt';
import { suggestDocumentTitle } from '../documents/documentImport/documentNaming';
import { needsPrescriptionReview, type HealthDocumentType, type HealthUploadReview } from '../../api/healthExtraction';
import type { DocumentAnalysisResponse } from '../../api/types';
import {
healthApi,
isMemberResolution,
type HealthMemberResolution,
type HealthRecordDetail,
} from '../../api/health.api';
import {
analyzeSelectedDocument,
type SelectedDocument,
} from '../documents/documentImport';

export type { HealthDocumentType } from '../../api/healthExtraction';

export const healthDocumentTypeLabels: Record<HealthDocumentType, string> = {
  lab_report: 'Lab Report',
  medical_report: 'Medical Report',
  prescription: 'Prescription',
};

export type HealthImportResult =
  | { kind: 'record'; record: HealthRecordDetail }
  | { kind: 'resolution'; resolution: HealthMemberResolution }
  | { kind: 'review'; analysis: DocumentAnalysisResponse };

export class HealthDocumentSavedError extends Error {}

export async function importHealthRecord(
  selected: SelectedDocument,
  options: { memberId?: string; type?: HealthDocumentType; aiConsent: boolean },
): Promise<HealthImportResult> {
  const analysis = await analyzeSelectedDocument(selected, options.aiConsent);
  if (needsPrescriptionReview(analysis.document.healthExtraction)) {
    return { kind: 'review', analysis };
  }
  return saveHealthRecordAnalysis(selected, options, analysis);
}

export async function saveHealthRecordAnalysis(
  selected: SelectedDocument,
  options: { memberId?: string; type?: HealthDocumentType; aiConsent: boolean },
  analysis: DocumentAnalysisResponse,
  healthReview?: HealthUploadReview,
): Promise<HealthImportResult> {
  const analysisUnavailable = analysis.warnings.some(
    warning => warning.code === 'AI_PROCESSING_DISABLED' ||
      warning.code === 'AI_ANALYSIS_UNAVAILABLE' ||
      warning.code === 'OPENAI_API_KEY_MISSING' ||
      warning.code === 'OPENAI_API_AUTH_FAILED' ||
      warning.code === 'OPENAI_QUOTA_EXCEEDED',
  );
  if (analysis.document.category !== 'Medical' && analysis.warnings.length === 0) {
    throw new Error('This file was not identified as a Health document. Upload it in Documents.');
  }
  if (!analysis.files.length) {
    throw new Error('The upload did not return a temporary file.');
  }
  const type = healthReview?.extraction.documentType ?? options.type ?? analysis.document.healthExtraction?.documentType;
  const saved = await saveDocumentWithDuplicatePrompt({
    ...(healthReview ? { healthReview } : {}),
    tempFileIds: analysis.files.map(file => file.tempFileId),
    originalName: analysis.files[0]?.originalName ?? selected.fileName,
    mimeType: analysis.files[0]?.mimeType ?? selected.mimeType,
    size: analysis.files.reduce((sum, file) => sum + file.size, 0),
    title: suggestDocumentTitle(analysis, selected.fileName),
    category: 'Medical',
    documentType: type
      ? healthDocumentTypeLabels[type]
      : 'Medical Report',
    confidence: analysisUnavailable || !options.aiConsent ? 0 : 90,
    fields: {},
    reviewFields: [],
    rawExtractedText: '',
    warnings: analysis.warnings,
    evidence: [],
    analysisSource: options.aiConsent && !analysisUnavailable ? 'ai' : 'rules',
    duplicateAction: 'fail',
    owner: 'self',
    userConfirmedUnknown: true,
    verified: false,
  });
  let record = saved.healthRecord;
  if (record === undefined) {
    if (healthReview) {
      throw new HealthDocumentSavedError('The document was saved, but this server did not confirm the reviewed prescription. Check the document and contact support before trying again.');
    }
    try {
      record = await healthApi.createRecord({
        memberId: options.memberId,
        documentId: saved.document.id,
        ...(type ? { type } : {}),
      });
    } catch (error) {
      throw new Error(`The document was saved, but could not be added to Health: ${error instanceof Error ? error.message : 'Please try again from Documents.'}`);
    }
  }
  if (!record) throw new HealthDocumentSavedError('The document was saved without a Health record. Please check it in Documents.');
  return isMemberResolution(record)
    ? { kind: 'resolution', resolution: record }
    : { kind: 'record', record };
}

export function resolutionMessage(resolution: HealthMemberResolution) {
  if (resolution.memberMatch.status === 'ambiguous') {
    return 'We found more than one matching profile. Choose the correct profile to continue.';
  }
  if (resolution.patient?.name) {
    return `No Health profile found for ${resolution.patient.name}. Choose a profile to continue.`;
  }
  return "We couldn't identify who this health record belongs to. Choose a profile to continue.";
}
