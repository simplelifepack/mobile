import type { HealthRecordDetail } from '../../api/health.api';

export function healthRecordProcessingMessage(record: HealthRecordDetail): string | undefined {
  switch (record.processingStatus) {
    case 'failed':
      return "The record was saved, but its information couldn't be read automatically.";
    case 'ai_processing_disabled':
      return 'The record was saved, but AI processing is off. Add any readings or medications manually.';
    case 'partial_medication_extraction':
    case 'handwritten_unreadable':
    case 'no_medications_detected':
      return record.processingError || 'The record was saved. Review and add any missing medications manually.';
    default:
      return undefined;
  }
}
