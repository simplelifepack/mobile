import type { WealthRecord } from '../../api/wealth.api';
import { recordReadinessGaps, wealthReadiness } from './wealthReadiness';

function record(overrides: Partial<WealthRecord> = {}): WealthRecord {
  return {
    id: 'wealth-1',
    type: 'ASSET',
    title: 'Savings account',
    details: {
      memberId: 'you',
      accountRef: '1234',
      amount: 1000,
      nomineeName: 'Asha',
      accessInstruction: 'Contact the bank',
    },
    attachmentDocumentIds: ['doc-1'],
    notes: 'Contact the bank',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    attachments: [{ id: 'attachment-1', documentId: 'doc-1', originalName: 'statement.pdf', category: 'Finance', mimeType: 'application/pdf', size: 10 }],
    ...overrides,
  };
}

it('counts only records with every applicable access detail as complete', () => {
  expect(recordReadinessGaps(record())).toEqual([]);
  expect(recordReadinessGaps(record({
    details: { memberId: 'you', amount: 1000 },
    attachmentDocumentIds: [],
    attachments: [],
    notes: '',
  }))).toEqual([
    'Owner or reference missing',
    'No nominee',
    'No document',
    'No access note',
  ]);
});

it('does not require nominees for loans and excludes settled informal transactions', () => {
  const loan = record({
    type: 'LOAN_TAKEN',
    details: { memberId: 'you', loanAccountNumber: 'LN1', principal: 1000, accessInstruction: 'Call bank' },
    attachmentDocumentIds: [],
    attachments: [],
  });
  expect(recordReadinessGaps(loan)).toEqual(['No document']);

  const settled = record({
    type: 'LOAN_GIVEN',
    details: { recordKind: 'money_lent_borrowed', status: 'settled', counterparty: 'Asha' },
  });
  expect(wealthReadiness([loan, settled])).toMatchObject({
    holdings: [loan],
    incomplete: [loan],
    percentage: 0,
  });
});
