import type {
  AnalyzeDocumentResponse,
  DocumentRecord,
  SaveDocumentPayload,
  WealthRecord,
  WealthRecordPayload,
} from '../../api/web.types';
import type { PickedDocument } from '../../native/documentFiles';
import { wealthRecordPayload } from '../../api/wealthRecord';
export type ProofDraft = {
  captureId: string;
  documentId?: string;
  recordId?: string;
};
type ProofApi = {
  analyze: (
    files: PickedDocument[],
    consent: boolean,
  ) => Promise<AnalyzeDocumentResponse>;
  saveDocument: (
    payload: SaveDocumentPayload,
  ) => Promise<{ document: DocumentRecord }>;
  listRecords: () => Promise<WealthRecord[]>;
  getRecord: (id: string) => Promise<WealthRecord>;
  createRecord: (payload: WealthRecordPayload) => Promise<WealthRecord>;
  updateRecord: (
    id: string,
    payload: WealthRecordPayload,
  ) => Promise<WealthRecord>;
};
/** Keep server-confirmed progress in the dialog draft so a retry never uploads it twice. */
export async function saveProofCapture(
  api: ProofApi,
  draft: ProofDraft,
  files: PickedDocument[],
  values: {
    title: string;
    amount?: number;
    currency: string;
    transactionDate: string;
    notes: string;
  },
  onDocumentSaved: (id: string) => void,
) {
  // List responses contain summaries; read only matching attachments for the draft marker.
  if (!draft.recordId && draft.documentId) {
    const candidates = (await api.listRecords()).filter(
      record =>
        record.type === 'PAYMENT_PROOF' &&
        record.attachmentDocumentIds?.includes(draft.documentId!),
    );
    for (const candidate of candidates) {
      const existing = await api.getRecord(candidate.id);
      if (existing.details.captureDraftId === draft.captureId) return existing;
    }
  }
  if (!draft.documentId) {
    if (!files.length)
      throw new Error('Choose a photo, screenshot, receipt, or PDF.');
    const analysis = await api.analyze(files, false);
    const first = analysis.files[0];
    if (!first)
      throw new Error('No upload was received. Choose your proof again.');
    const { document } = await api.saveDocument({
      tempFileIds: analysis.files.map(file => file.tempFileId),
      originalName: first.originalName,
      mimeType: first.mimeType,
      size: analysis.files.reduce((sum, file) => sum + file.size, 0),
      title: values.title,
      category: 'Finance',
      documentType: 'Payment Proof',
      confidence: 100,
      fields: {},
      reviewFields: [],
      rawExtractedText: '',
      warnings: analysis.warnings,
      evidence: [],
      analysisSource: 'manual',
      userConfirmedUnknown: true,
    });
    draft.documentId = document.id;
    onDocumentSaved(document.id);
  }
  if (draft.recordId) {
    // Read the latest record so attachment updates preserve concurrent edits and proofs.
    const record = await api.getRecord(draft.recordId);
    const payload = wealthRecordPayload(record);
    if (payload.attachmentDocumentIds.includes(draft.documentId)) return record;
    return api.updateRecord(record.id, {
      ...payload,
      attachmentDocumentIds: [
        ...payload.attachmentDocumentIds,
        draft.documentId,
      ],
    });
  }
  return api.createRecord({
    type: 'PAYMENT_PROOF',
    title: values.title,
    notes: values.notes,
    details: {
      recordKind: 'payment_proof',
      captureDraftId: draft.captureId,
      amount: values.amount ?? null,
      currency: values.currency,
      transactionDate: values.transactionDate,
    },
    followUpDate: null,
    followUpNote: '',
    attachmentDocumentIds: [draft.documentId],
  });
}
