import type { WealthRecord, WealthRecordPayload } from './web.types';
/** Detail responses include computed properties and nullable notes that writes do not accept. */
export function wealthRecordPayload(
  record: WealthRecord,
  changes: Partial<WealthRecordPayload> = {},
): WealthRecordPayload {
  return {
    type: record.type,
    title: record.title,
    details: record.details,
    notes: record.notes ?? '',
    followUpDate: record.followUpDate ?? null,
    followUpNote: record.followUpNote ?? '',
    attachmentDocumentIds:
      record.attachmentDocumentIds ??
      record.attachments.map(item => item.documentId),
    ...changes,
  };
}
