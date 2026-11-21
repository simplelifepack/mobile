import type { HealthRecordDetail } from '../../api/health.api';
import { healthRecordProcessingMessage } from './healthRecordStatus';

const record: HealthRecordDetail = {
  id: 'record', memberId: 'member', documentId: 'doc', type: 'prescription',
  documentDate: null, processingStatus: 'processed', measurementCount: 0,
  trackedMeasurementCount: 0, medicationCount: 0, followUpCount: 0,
  createdAt: '2026-01-01', measurements: [], medications: [], followUps: [], reminders: [],
};

it.each([
  ['failed', "couldn't be read"],
  ['ai_processing_disabled', 'AI processing is off'],
  ['partial_medication_extraction', 'missing medications'],
  ['handwritten_unreadable', 'missing medications'],
  ['no_medications_detected', 'missing medications'],
])('reports %s without claiming successful extraction', (processingStatus, message) => {
  expect(healthRecordProcessingMessage({ ...record, processingStatus })).toContain(message);
});

it('uses a processing error when the prescription was only partially read', () => {
  expect(healthRecordProcessingMessage({
    ...record, processingStatus: 'partial_medication_extraction', processingError: 'Review handwriting',
  })).toBe('Review handwriting');
});

it('leaves successful records without a warning', () => {
  expect(healthRecordProcessingMessage(record)).toBeUndefined();
});
