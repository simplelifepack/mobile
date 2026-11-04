import { recordAmount } from './WealthGroups';
import type { WealthRecord } from '../../api/web.types';
it('preserves unknown values and uses outstanding loan amounts instead of original principal', () => {
  const record = {
    details: {},
    loanBreakdown: null,
  } as unknown as WealthRecord;
  expect(recordAmount(record)).toBeNull();
  expect(recordAmount({ ...record, details: { amount: '1,250.50' } })).toBe(
    1250.5,
  );
  expect(
    recordAmount({ ...record, details: { amount: 'unknown' } }),
  ).toBeNull();
  expect(
    recordAmount({
      ...record,
      details: { principalAmount: 5000 },
      loanBreakdown: { outstanding: 300 },
    } as WealthRecord),
  ).toBe(300);
});
