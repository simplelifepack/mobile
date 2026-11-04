import { documentDefaults, entryPayload } from './wealthEntryModel';
import type { DocumentRecord } from '../../api/web.types';
it('fills holding facts from the chosen document and preserves proof, access and ownership on creation', () => {
  const defaults = documentDefaults({
    id: 'policy',
    displayName: 'Family cover',
    category: 'Insurance',
    documentType: 'Health Insurance',
    fields: {
      insurerName: 'Provider',
      policyNumber: 'P123',
      sumAssured: '500000',
      currency: 'INR',
    },
  } as DocumentRecord);
  expect(defaults).toMatchObject({
    kind: 'cover',
    institution: 'Provider',
    accountRef: 'P123',
    amount: '500000',
  });
  const result = entryPayload(
    'holding',
    {
      ...defaults,
      memberId: 'member1',
      nomineeName: 'Nominee',
      accessInstruction: 'Contact insurer',
      renewalDate: '',
      maturityDate: '',
    },
    'policy',
  );
  expect(result).toMatchObject({
    type: 'INSURANCE',
    attachmentDocumentIds: ['policy'],
    details: {
      memberId: 'member1',
      coverageAmount: 500000,
      nomineeName: 'Nominee',
      accessInstruction: 'Contact insurer',
    },
  });
});
it('records loan direction, separate person/purpose and follow-up proof metadata', () => {
  const result = entryPayload(
    'money',
    {
      title: 'Deposit',
      who: 'Person',
      amount: '100',
      currency: 'USD',
      direction: 'BORROWED',
      date: '2026-10-27',
      followUpDate: '2026-11-27',
      followUpNote: 'Call',
    },
    'receipt',
  );
  expect(result).toMatchObject({
    type: 'LOAN_TAKEN',
    followUpDate: '2026-11-27',
    followUpNote: 'Call',
    attachmentDocumentIds: ['receipt'],
    details: {
      direction: 'BORROWED',
      who: 'Person',
      whatFor: 'Deposit',
      receivedFrom: 'Person',
      proofStatus: 'attached',
    },
  });
  expect(() =>
    entryPayload('money', { amount: '-10', currency: 'USD' }),
  ).toThrow('amount');
  expect(() =>
    entryPayload('money', { amount: 'NaN', currency: 'USD' }),
  ).toThrow('amount');
});
