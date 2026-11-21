import { documentsApi } from '../../api/documents.api';
import { healthApi, type HealthMemberResolution, type HealthRecordDetail } from '../../api/health.api';
import type { DocumentAnalysisResponse, DocumentRecord } from '../../api/types';
import { analyzeSelectedDocument } from '../documents/documentImport';
import { importHealthRecord, saveHealthRecordAnalysis } from './healthRecordImport';

jest.mock('../documents/documentImport', () => ({
  analyzeSelectedDocument: jest.fn(),
}));

const selected = { path: '/report.pdf', fileName: 'report.pdf', mimeType: 'application/pdf' as const };
const analysis: DocumentAnalysisResponse = {
  success: true,
  document: {
    title: 'Report',
    category: 'Medical',
    documentType: 'Lab Report',
    confidence: 90,
    healthExtraction: null,
  },
  files: [{ tempFileId: 'temp', originalName: 'report.pdf', mimeType: 'application/pdf', size: 10 }],
  warnings: [],
};
const document: DocumentRecord = {
  id: 'doc', originalName: 'report.pdf', documentType: 'Lab Report',
  category: 'Medical', classificationStatus: 'detected', ownershipStatus: 'unknown',
  confidence: 90, createdAt: '2026-01-01',
};
const record: HealthRecordDetail = {
  id: 'record', memberId: 'matched-member', documentId: 'doc', type: 'lab_report',
  documentDate: null, processingStatus: 'processed', measurementCount: 0,
  trackedMeasurementCount: 0, medicationCount: 0, followUpCount: 0,
  createdAt: '2026-01-01', measurements: [], medications: [], followUps: [], reminders: [],
};
const resolution: HealthMemberResolution = {
  type: 'lab_report', documentId: 'doc', processingStatus: 'awaiting_profile_match',
  patient: { name: 'Patient' }, memberMatch: { status: 'ambiguous', candidates: [] },
};

beforeEach(() => {
  jest.mocked(analyzeSelectedDocument).mockResolvedValue(analysis);
});
afterEach(() => jest.restoreAllMocks());

it('uses the automatically matched record without creating a second record', async () => {
  const save = jest.spyOn(documentsApi, 'save').mockResolvedValue({ document, healthRecord: record });
  const create = jest.spyOn(healthApi, 'createRecord');
  await expect(importHealthRecord(selected, { aiConsent: true, memberId: 'selected', type: 'lab_report' }))
    .resolves.toEqual({ kind: 'record', record });
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ documentType: 'Lab Report' }));
  expect(create).not.toHaveBeenCalled();
});

it('returns a pending profile match from the save response without creating a record', async () => {
  jest.spyOn(documentsApi, 'save').mockResolvedValue({ document, healthRecord: resolution });
  const create = jest.spyOn(healthApi, 'createRecord');
  await expect(importHealthRecord(selected, { aiConsent: true }))
    .resolves.toEqual({ kind: 'resolution', resolution });
  expect(create).not.toHaveBeenCalled();
});

it('reports when the new API saved a document without creating a Health record', async () => {
  jest.spyOn(documentsApi, 'save').mockResolvedValue({ document, healthRecord: null });
  const create = jest.spyOn(healthApi, 'createRecord');
  await expect(importHealthRecord(selected, { aiConsent: true }))
    .rejects.toThrow('saved without a Health record');
  expect(create).not.toHaveBeenCalled();
});

it('uses the legacy endpoint only when the save response lacks healthRecord', async () => {
  jest.spyOn(documentsApi, 'save').mockResolvedValue({ document });
  const create = jest.spyOn(healthApi, 'createRecord').mockResolvedValue(record);
  await importHealthRecord(selected, { aiConsent: true, memberId: 'selected', type: 'lab_report' });
  expect(create).toHaveBeenCalledWith({ memberId: 'selected', documentId: 'doc', type: 'lab_report' });
});

it('tells the user when legacy Health creation fails after the document was saved', async () => {
  jest.spyOn(documentsApi, 'save').mockResolvedValue({ document });
  jest.spyOn(healthApi, 'createRecord').mockRejectedValue(new Error('Unavailable'));
  await expect(importHealthRecord(selected, { aiConsent: true }))
    .rejects.toThrow('document was saved, but could not be added to Health: Unavailable');
});

it('preserves disabled or failed processing responses and the manual type', async () => {
  jest.mocked(analyzeSelectedDocument).mockResolvedValue({
    ...analysis, document: { ...analysis.document, healthExtraction: null },
    warnings: [{ code: 'AI_PROCESSING_DISABLED', message: 'Disabled' }],
  });
  const disabled = { ...record, type: 'prescription' as const, processingStatus: 'ai_processing_disabled' };
  const save = jest.spyOn(documentsApi, 'save').mockResolvedValue({ document, healthRecord: disabled });
  await expect(importHealthRecord(selected, { aiConsent: false, type: 'prescription' }))
    .resolves.toEqual({ kind: 'record', record: disabled });
  expect(save).toHaveBeenCalledWith(expect.objectContaining({
    analysisSource: 'rules', confidence: 0, documentType: 'Prescription',
  }));
});

it('does not label failed AI analysis as a successful AI extraction', async () => {
  jest.mocked(analyzeSelectedDocument).mockResolvedValue({
    ...analysis, document: { ...analysis.document, healthExtraction: null },
    warnings: [{ code: 'AI_ANALYSIS_UNAVAILABLE', message: 'Unavailable' }],
  });
  const failed = { ...record, processingStatus: 'failed' };
  const save = jest.spyOn(documentsApi, 'save').mockResolvedValue({ document, healthRecord: failed });
  await expect(importHealthRecord(selected, { aiConsent: true }))
    .resolves.toEqual({ kind: 'record', record: failed });
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ analysisSource: 'rules', confidence: 0 }));
});

it('does not save clearly nonmedical analysis as a Health record', async () => {
  jest.mocked(analyzeSelectedDocument).mockResolvedValue({
    ...analysis, document: { ...analysis.document, category: 'Finance', healthExtraction: null },
  });
  const save = jest.spyOn(documentsApi, 'save');
  await expect(importHealthRecord(selected, { aiConsent: true })).rejects.toThrow('not identified as a Health document');
  expect(save).not.toHaveBeenCalled();
});

it('pauses extracted health documents for review before saving', async () => {
  jest.mocked(analyzeSelectedDocument).mockResolvedValue({
    ...analysis,
    document: { ...analysis.document, healthExtraction: { documentType: 'lab_report', measurements: [], medications: [], followUps: [] } },
  });
  const save = jest.spyOn(documentsApi, 'save');
  await expect(importHealthRecord(selected, { aiConsent: true })).resolves.toMatchObject({ kind: 'review' });
  expect(save).not.toHaveBeenCalled();
});

it('pauses handwritten prescription uploads before saving', async () => {
  const handwritten: DocumentAnalysisResponse = {
    ...analysis,
    document: {
      ...analysis.document,
      healthExtraction: {
        documentType: 'prescription', measurements: [], followUps: [],
        medications: [{ name: 'Medicine', dose: '5 mg' }],
        prescriptionAnalysis: { isHandwritten: true, hasUnreadableMedicationText: false, outcome: 'medications_detected' },
      },
    },
  };
  jest.mocked(analyzeSelectedDocument).mockResolvedValue(handwritten);
  const save = jest.spyOn(documentsApi, 'save');
  await expect(importHealthRecord(selected, { aiConsent: true })).resolves.toEqual({ kind: 'review', analysis: handwritten });
  expect(save).not.toHaveBeenCalled();
});

it('sends reviewed information on save and uses the returned record', async () => {
  const review = {
    extraction: {
      documentType: 'prescription' as const, measurements: [], followUps: [],
      medications: [{ name: 'Corrected medicine', dose: '10 mg' }],
    },
  };
  const save = jest.spyOn(documentsApi, 'save').mockResolvedValue({ document, healthRecord: record });
  const create = jest.spyOn(healthApi, 'createRecord');
  await saveHealthRecordAnalysis(selected, { aiConsent: true }, analysis, review);
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ healthReview: review, documentType: 'Prescription' }));
  expect(create).not.toHaveBeenCalled();
});

it('does not pretend a legacy server saved reviewed clinical information', async () => {
  const review = {
    extraction: { documentType: 'prescription' as const, measurements: [], followUps: [], medications: [] },
  };
  jest.spyOn(documentsApi, 'save').mockResolvedValue({ document });
  const create = jest.spyOn(healthApi, 'createRecord');
  await expect(saveHealthRecordAnalysis(selected, { aiConsent: true }, analysis, review))
    .rejects.toThrow('server did not confirm the reviewed prescription');
  expect(create).not.toHaveBeenCalled();
});
