import { wealthSummary } from './wealthSummary';
import type { WealthRecord } from '../../api/web.types';
const record = (
  details: WealthRecord['details'],
  type: WealthRecord['type'] = 'ASSET',
) =>
  ({
    id: String(Math.random()),
    title: 'Fixture',
    type,
    details,
    attachments: [],
    attachmentDocumentIds: [],
  }) as WealthRecord;
it('keeps currencies separate and uses remaining loan balances', () => {
  const loan = {
    ...record({ currency: 'INR', principalAmount: 1000 }, 'LOAN_TAKEN'),
    loanBreakdown: { outstanding: 400 },
  };
  expect(
    wealthSummary([
      record({ currency: 'INR', value: '12,000', nominee: 'Fixture' }),
      record({ currency: 'USD', amount: 100 }),
      loan,
    ]),
  ).toMatchObject({
    currencies: [
      { currency: 'INR', assets: 12000, owed: 400 },
      { currency: 'USD', assets: 100, owed: 0 },
    ],
    missingProof: 3,
    nomineeGaps: 1,
  });
});
it('matches web family access scoring without counting nominees or cash proof exceptions as uploaded documents', () => {
  const documented = {
    ...record({ nominee: 'Family' }),
    attachments: [{ id: 'proof' }],
  } as WealthRecord;
  const accessible = { ...record({ accessInstruction: 'Contact the branch' }) };
  const cash = record(
    { recordKind: 'money_lent_borrowed', proofStatus: 'cash_no_record' },
    'LOAN_GIVEN',
  );
  expect(wealthSummary([documented, accessible, cash])).toMatchObject({
    readiness: 50,
    accessMissing: 1,
  });
});
