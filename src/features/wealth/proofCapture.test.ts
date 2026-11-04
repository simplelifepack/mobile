import { saveProofCapture, type ProofDraft } from './proofCapture';
import type {
  AnalyzeDocumentResponse,
  DocumentRecord,
  WealthRecord,
  WealthRecordPayload,
} from '../../api/web.types';
const file = {
  uri: 'file:///private/proof.jpg',
  name: 'proof.jpg',
  type: 'image/jpeg',
  size: 24,
};
const values = {
  title: 'QA payment',
  currency: 'INR',
  transactionDate: '2026-10-26',
  notes: '',
};
function fixture() {
  const records: WealthRecord[] = [];
  const api = {
    analyze: jest.fn(
      async () =>
        ({
          files: [
            {
              tempFileId: 'temp',
              originalName: 'proof.jpg',
              mimeType: 'image/jpeg',
              size: 24,
            },
          ],
          warnings: [],
        }) as unknown as AnalyzeDocumentResponse,
    ),
    saveDocument: jest.fn(async () => ({
      document: { id: 'proof-document' } as DocumentRecord,
    })),
    listRecords: jest.fn(async () => records),
    getRecord: jest.fn(async () => records[0]),
    createRecord: jest.fn(
      async (payload: WealthRecordPayload) =>
        ({ ...payload, id: 'wealth-record', attachments: [] }) as WealthRecord,
    ),
    updateRecord: jest.fn(
      async (id: string, payload: WealthRecordPayload) =>
        ({ ...payload, id, attachments: [] }) as WealthRecord,
    ),
  };
  return { api, records };
}
it('retains the saved proof when creating a Wealth record fails, then retries without uploading again', async () => {
  const { api } = fixture();
  api.createRecord.mockRejectedValueOnce(new Error('Offline'));
  const draft: ProofDraft = { captureId: 'draft' };
  const onSaved = jest.fn();
  await expect(
    saveProofCapture(api, draft, [file], values, onSaved),
  ).rejects.toThrow('Offline');
  expect(draft.documentId).toBe('proof-document');
  await expect(
    saveProofCapture(api, draft, [], values, onSaved),
  ).resolves.toMatchObject({ id: 'wealth-record' });
  expect(api.analyze).toHaveBeenCalledTimes(1);
  expect(api.analyze).toHaveBeenCalledWith([file], false);
  expect(api.saveDocument).toHaveBeenCalledTimes(1);
  expect(onSaved).toHaveBeenCalledTimes(1);
});
it('reconciles a committed record after a lost response before issuing another create', async () => {
  const { api, records } = fixture();
  api.createRecord.mockImplementationOnce(async payload => {
    records.push({
      ...payload,
      id: 'committed',
      attachments: [],
    } as WealthRecord);
    api.listRecords.mockResolvedValueOnce([
      { ...records[0], details: { recordKind: 'payment_proof' } },
    ]);
    throw new Error('Response lost');
  });
  const draft: ProofDraft = { captureId: 'lost-response' };
  await expect(
    saveProofCapture(api, draft, [file], values, jest.fn()),
  ).rejects.toThrow('Response lost');
  await expect(
    saveProofCapture(api, draft, [], values, jest.fn()),
  ).resolves.toMatchObject({ id: 'committed' });
  expect(api.createRecord).toHaveBeenCalledTimes(1);
  expect(api.analyze).toHaveBeenCalledTimes(1);
});
it('reads current attachments and preserves concurrent record changes, and makes an attachment retry a no-op', async () => {
  const { api, records } = fixture();
  records.push({
    id: 'existing',
    type: 'ASSET',
    title: 'Updated title',
    notes: 'Concurrent note',
    details: { value: 12 },
    attachmentDocumentIds: ['older-proof'],
    attachments: [],
  } as WealthRecord);
  const draft: ProofDraft = { captureId: 'attach', recordId: 'existing' };
  await saveProofCapture(api, draft, [file], values, jest.fn());
  expect(api.updateRecord).toHaveBeenCalledWith(
    'existing',
    expect.objectContaining({
      title: 'Updated title',
      notes: 'Concurrent note',
      attachmentDocumentIds: ['older-proof', 'proof-document'],
    }),
  );
  records[0].attachmentDocumentIds!.push('proof-document');
  await saveProofCapture(api, draft, [], values, jest.fn());
  expect(api.updateRecord).toHaveBeenCalledTimes(1);
  expect(api.createRecord).not.toHaveBeenCalled();
});
