import type { WealthRecord } from '../../api/wealth.api';

const hasDetail = (record: WealthRecord, keys: string[]) =>
  keys.some(key => {
    const value = record.details[key];
    return typeof value === 'string'
      ? value.trim().length > 0
      : typeof value === 'number' && Number.isFinite(value);
  });

export function isInformalTransaction(record: WealthRecord) {
  return record.details.recordKind === 'money_lent_borrowed' ||
    Boolean(record.details.counterparty ?? record.details.borrower ?? record.details.lender);
}

export function isScoredHolding(record: WealthRecord) {
  return record.type !== 'PAYMENT_PROOF' &&
    !(isInformalTransaction(record) && (
      record.details.status === 'settled' || record.details.status === 'SETTLED'
    ));
}

export function recordReadinessGaps(record: WealthRecord) {
  const gaps: string[] = [];
  const hasOwner = hasDetail(record, ['memberId', 'owner', 'ownerName', 'ownerProfileId']);
  const hasReference = hasDetail(record, [
    'accountRef', 'accountNumber', 'accountNumberMasked', 'policyNumber',
    'referenceNumber', 'loanAccountNumber',
  ]);
  if (!hasOwner || !hasReference) gaps.push('Owner or reference missing');

  const hasValue = hasDetail(record, [
    'amount', 'value', 'marketValue', 'coverageAmount', 'sumAssured',
    'principalAmount', 'principal', 'outstanding',
  ]);
  if (!hasValue) gaps.push('Value or amount missing');

  if ((record.type === 'ASSET' || record.type === 'INSURANCE') &&
      !hasDetail(record, ['nominee', 'nomineeName'])) {
    gaps.push('No nominee');
  }

  if (!(record.attachments?.length ?? record.attachmentDocumentIds?.length ?? 0)) {
    gaps.push('No document');
  }
  if (!hasDetail(record, ['accessInstruction', 'accessNote']) && !record.notes?.trim()) {
    gaps.push('No access note');
  }
  return gaps;
}

export function wealthReadiness(records: WealthRecord[]) {
  const holdings = records.filter(isScoredHolding);
  const complete = holdings.filter(record => recordReadinessGaps(record).length === 0);
  return {
    holdings,
    complete,
    incomplete: holdings.filter(record => recordReadinessGaps(record).length > 0),
    percentage: holdings.length ? Math.round((complete.length / holdings.length) * 100) : 0,
  };
}
