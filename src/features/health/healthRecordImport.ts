import { documentsApi } from '../../api/documents.api';
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

export type HealthDocumentType = 'lab_report' | 'medical_report' | 'prescription';

export const healthDocumentTypeLabels: Record<HealthDocumentType, string> = {
  lab_report: 'Lab Report',
  medical_report: 'Medical Report',
  prescription: 'Prescription',
};

export type HealthImportResult =
  | { kind: 'record'; record: HealthRecordDetail }
  | { kind: 'resolution'; resolution: HealthMemberResolution };

// Mirrors the web flow: encrypt + analyze, save as a Medical document, then create the health record.
export async function importHealthRecord(
  selected: SelectedDocument,
  options: { memberId?: string; type?: HealthDocumentType; aiConsent: boolean },
): Promise<HealthImportResult> {
  const analysis = await analyzeSelectedDocument(selected, options.aiConsent);
  const aiDisabled = analysis.warnings.some(
    warning => warning.code === 'AI_PROCESSING_DISABLED',
  );
  const saved = await documentsApi.save({
    tempFileIds: analysis.files.map(file => file.tempFileId),
    originalName: analysis.files[0]?.originalName ?? selected.fileName,
    mimeType: analysis.files[0]?.mimeType ?? selected.mimeType,
    size: analysis.files.reduce((sum, file) => sum + file.size, 0),
    title: selected.fileName,
    category: 'Medical',
    documentType: options.type
      ? healthDocumentTypeLabels[options.type]
      : 'Medical Report',
    confidence: aiDisabled || !options.aiConsent ? 0 : 90,
    fields: {},
    reviewFields: [],
    rawExtractedText: '',
    warnings: analysis.warnings,
    evidence: [],
    analysisSource: options.aiConsent && !aiDisabled ? 'ai' : 'rules',
    duplicateAction: 'keep_both',
    owner: 'self',
    userConfirmedUnknown: true,
    verified: false,
  });
  const record = await healthApi.createRecord({
    memberId: options.memberId,
    documentId: saved.document.id,
    ...(options.type ? { type: options.type } : {}),
  });
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
