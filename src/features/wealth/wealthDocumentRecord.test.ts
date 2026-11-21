import type { DocumentAnalysisResponse, DocumentRecord } from '../../api/types';
import {
  wealthRecordPayloadFromDocument,
  wealthRecordTypeForDocument,
} from './wealthDocumentRecord';

const analysis: DocumentAnalysisResponse['document'] = {
  title: 'HDFC savings statement',
  category: 'Finance',
  documentType: 'Bank Statement',
  confidence: 95,
  fields: {
    bankName: 'HDFC',
    accountNumber: '123456789012',
    currentBalance: '480000',
  },
};

const saved: DocumentRecord = {
  id: 'doc-1',
  title: 'HDFC savings statement',
  originalName: 'statement.pdf',
  documentType: 'Bank Statement',
  category: 'Finance',
  classificationStatus: 'detected',
  ownershipStatus: 'verified',
  confidence: 95,
  createdAt: '2026-11-14T00:00:00.000Z',
};

it.each([
  ['INSURANCE', { category: 'Finance', documentType: 'Life Insurance Policy' }],
  ['LOAN_TAKEN', { category: 'Finance', documentType: 'Home Loan Statement' }],
  ['ASSET', { category: 'Finance', documentType: 'Mutual Fund Statement' }],
])('classifies %s documents as wealth records', (expected, input) => {
  expect(
    wealthRecordTypeForDocument({
      title: 'Statement',
      confidence: 90,
      ...input,
    }),
  ).toBe(expected);
});

it.each([
  { category: 'Finance', documentType: 'Income Tax Return' },
  { category: 'Finance', documentType: 'Salary Slip' },
  { category: 'Other', documentType: 'Unknown' },
])('does not classify unrelated documents as wealth records', input => {
  expect(
    wealthRecordTypeForDocument({
      title: 'Document',
      confidence: 50,
      ...input,
    }),
  ).toBeUndefined();
});

it('creates an attached account record with extracted financial details', () => {
  expect(wealthRecordPayloadFromDocument(saved, analysis)).toEqual(
    expect.objectContaining({
      type: 'ASSET',
      title: 'HDFC savings statement',
      attachmentDocumentIds: ['doc-1'],
      details: expect.objectContaining({
        memberId: 'you',
        institution: 'HDFC',
        accountRef: '123456789012',
        amount: '480000',
        currency: 'INR',
      }),
    }),
  );
});
