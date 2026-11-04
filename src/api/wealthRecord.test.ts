import { wealthRecordPayload } from './wealthRecord';
import type { WealthRecord } from './web.types';
it('sends writable fields and normalizes nullable detail-response notes', () => {
  const record = {
    id: 'r1',
    type: 'ASSET',
    title: 'Holding',
    details: { amount: 100 },
    notes: null,
    followUpNote: null,
    followUpDate: null,
    attachments: [{ documentId: 'd1' }],
    loanBreakdown: { outstanding: 20 },
  } as unknown as WealthRecord;
  expect(wealthRecordPayload(record)).toEqual({
    type: 'ASSET',
    title: 'Holding',
    details: { amount: 100 },
    notes: '',
    followUpNote: '',
    followUpDate: null,
    attachmentDocumentIds: ['d1'],
  });
});
