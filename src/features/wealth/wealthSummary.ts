import { statusFor } from './wealthPresentation';
import type { WealthRecord } from '../../api/web.types';
export type CurrencyTotals = {
  currency: string;
  assets: number;
  owed: number;
  lent: number;
  insurance: number;
};
const amount = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value
    : typeof value === 'string'
      ? Number(value.replace(/[^0-9.-]/g, '')) || 0
      : 0;
export function wealthSummary(records: WealthRecord[]) {
  const currencies = new Map<string, CurrencyTotals>();
  let missingProof = 0,
    nomineeGaps = 0;
  for (const record of records) {
    const currency =
      typeof record.details.currency === 'string' && record.details.currency
        ? record.details.currency
        : 'INR';
    const total = currencies.get(currency) ?? {
      currency,
      assets: 0,
      owed: 0,
      lent: 0,
      insurance: 0,
    };
    if (record.type === 'ASSET')
      total.assets += amount(record.details.value ?? record.details.amount);
    if (record.type === 'LOAN_TAKEN')
      total.owed +=
        record.loanBreakdown?.outstanding ??
        amount(record.details.principalAmount ?? record.details.amount);
    if (record.type === 'LOAN_GIVEN')
      total.lent +=
        record.loanBreakdown?.outstanding ?? amount(record.details.amount);
    if (record.type === 'INSURANCE')
      total.insurance += amount(
        record.details.coverageAmount ?? record.details.amount,
      );
    currencies.set(currency, total);
    if (!(record.attachmentDocumentIds?.length || record.attachments?.length))
      missingProof += 1;
    if (
      ['ASSET', 'INSURANCE'].includes(record.type) &&
      !String(record.details.nomineeName ?? record.details.nominee ?? '').trim()
    )
      nomineeGaps += 1;
  }
  const documented = records.filter(
    record =>
      (record.attachments?.length ??
        record.attachmentDocumentIds?.length ??
        0) > 0,
  ).length;
  const accessReady = records.filter(record => statusFor(record).access).length;
  const readiness = records.length
    ? Math.round(((documented + accessReady) / (records.length * 2)) * 100)
    : 0;
  return {
    currencies: [...currencies.values()],
    missingProof,
    nomineeGaps,
    readiness,
    accessMissing: records.length - accessReady,
    documented,
  };
}
