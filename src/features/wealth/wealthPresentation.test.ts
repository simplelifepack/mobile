import type { WealthRecord } from '../../api/web.types';
import { wealthRecordTypeLabel, wealthRecordFacts } from './wealthPresentation';
it('uses the same category label in details as in the Wealth list for legacy records', () => {
  const record = {
    id: 'legacy-account',
    title: 'Savings account',
    attachmentDocumentIds: [],
    attachments: [],
    type: 'INSURANCE',
    details: { assetType: 'Account' },
  } as WealthRecord;
  expect(wealthRecordTypeLabel(record)).toBe('Accounts and investments');
  expect(
    wealthRecordTypeLabel({
      ...record,
      details: { insuranceType: 'life_insurance' },
    }),
  ).toBe('Insurance');
  expect(
    wealthRecordTypeLabel({
      ...record,
      details: { recordKind: 'money_lent_borrowed' },
    }),
  ).toBe('Lent, borrowed and proofs');
});

it('removes repeated compatibility fields and metadata while preserving distinct financial values', () => {
  const record: WealthRecord = {
    id: 'record',
    title: 'Groceries',
    type: 'LOAN_GIVEN',
    attachmentDocumentIds: ['private-document-id'],
    attachments: [],
    details: {
      recordKind: 'money_lent_borrowed',
      whatFor: 'Groceries',
      amount: 50,
      principalAmount: 50,
      coverageAmount: 75,
      transactionDate: '2026-10-27',
      date: '2026-10-27',
      who: 'Example',
      party: 'Example',
      paidTo: 'Example',
      direction: 'LENT',
      proofStatus: 'cash_no_record',
      sourceDocumentId: 'private-document-id',
      sourceDocumentCategory: 'financial',
      provider: '',
      interest: 0,
      settled: false,
    },
    notes: '',
  };
  const facts = wealthRecordFacts(record);
  expect(facts).toMatchObject({
    amount: 50,
    coverageAmount: 75,
    interest: 0,
    settled: false,
    direction: 'Lent',
    proofStatus: 'Cash payment without proof',
    linkedDocuments: 'None',
  });
  for (const key of [
    'title',
    'whatFor',
    'recordKind',
    'principalAmount',
    'date',
    'party',
    'paidTo',
    'sourceDocumentId',
    'sourceDocumentCategory',
    'provider',
    'notes',
  ]) {
    expect(facts).not.toHaveProperty(key);
  }
  expect(facts.transactionDate).toBe('2026-10-27');
  expect(facts.who).toBe('Example');
  expect(JSON.stringify(facts)).not.toContain('private-document-id');
});
