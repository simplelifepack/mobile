import type { WealthRecord } from '../../api/web.types';
function isMoneyLentBorrowed(record: WealthRecord) {
  return record.details.recordKind === 'money_lent_borrowed';
}

export type WealthRecordDomain =
  'asset' | 'liability' | 'protection' | 'lentBorrowed';

const assetTypes = new Set([
  'account',
  'bank_account',
  'savings_account',
  'fixed_deposit',
  'fd',
  'investment',
  'investment_account',
  'mutual_fund',
  'stocks',
  'retirement',
  'nps',
  'pf',
  'epf',
  'ppf',
  'property',
  'gold',
  'bank_locker',
  'vehicle',
]);

const liabilityTypes = new Set([
  'loan',
  'personal_loan',
  'home_loan',
  'mortgage',
  'auto_loan',
  'vehicle_loan',
  'education_loan',
  'business_loan',
]);

const insuranceTypes = new Set([
  'insurance',
  'life_insurance',
  'health_insurance',
  'vehicle_insurance',
  'property_insurance',
  'crop_insurance',
]);

const proofTypes = new Set([
  'payment_proof',
  'receipt',
  'bank_transfer',
  'upi_payment',
  'cash_payment',
  'tax_payment',
]);

function token(value: unknown) {
  return typeof value === 'string'
    ? value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
    : '';
}

function firstToken(...values: unknown[]) {
  return values.map(token).find(Boolean) ?? '';
}

export function classifyWealthRecord(record: WealthRecord): WealthRecordDomain {
  if (isMoneyLentBorrowed(record)) {
    return 'lentBorrowed';
  }

  const category = firstToken(
    record.details.categoryCode,
    record.details.category,
    record.details.kind,
  );
  if (
    category === 'asset' ||
    category === 'holding' ||
    category === 'accounts' ||
    category === 'accounts_and_investments' ||
    category === 'accounts_investments'
  )
    return 'asset';
  if (
    category === 'loan' ||
    category === 'loans' ||
    category === 'liability' ||
    category === 'liabilities'
  )
    return 'liability';
  if (
    category === 'insurance' ||
    category === 'policy' ||
    category === 'policies' ||
    category === 'cover' ||
    category === 'protection'
  )
    return 'protection';
  if (category === 'payment_proof' || category === 'proof')
    return 'lentBorrowed';

  const subtype = firstToken(
    record.details.assetType,
    record.details.loanType,
    record.details.insuranceType,
    record.details.subtypeCode,
    record.details.subtype,
    record.details.type,
  );
  if (assetTypes.has(subtype)) return 'asset';
  if (liabilityTypes.has(subtype)) return 'liability';
  if (insuranceTypes.has(subtype)) return 'protection';
  if (proofTypes.has(subtype)) return 'lentBorrowed';

  if (record.type === 'ASSET') return 'asset';
  if (record.type === 'LOAN_TAKEN') return 'liability';
  if (record.type === 'INSURANCE') return 'protection';
  return 'lentBorrowed';
}

export function statusFor(record: WealthRecord) {
  const proofOptional =
    isMoneyLentBorrowed(record) &&
    record.details.proofStatus === 'cash_no_record';
  return {
    document:
      proofOptional ||
      (record.attachments?.length ??
        record.attachmentDocumentIds?.length ??
        0) > 0,
    nominee: Boolean(record.details.nominee),
    access:
      isMoneyLentBorrowed(record) ||
      Boolean(record.details.accessInstruction || record.notes),
  };
}

export function wealthRecordTypeLabel(record: WealthRecord) {
  return {
    asset: 'Accounts and investments',
    liability: 'Loans',
    protection: 'Insurance',
    lentBorrowed: 'Lent, borrowed and proofs',
  }[classifyWealthRecord(record)];
}

/** Display record facts without transport metadata or repeated compatibility fields. */
export function wealthRecordFacts(record: WealthRecord) {
  const details = { ...record.details };
  const groups = [
    ['provider', 'institution'],
    ['accountRef', 'accountNumber'],
    ['nominee', 'nomineeName'],
    ['transactionDate', 'date'],
    ['who', 'party', 'paidTo', 'receivedFrom'],
    ['amount', 'value', 'principalAmount', 'coverageAmount'],
    ['type', 'assetType', 'loanType', 'insuranceType', 'subtype'],
  ];
  for (const keys of groups) {
    const seen = new Set<string>();
    for (const key of keys) {
      const value = details[key];
      if (value == null || value === '') continue;
      const normalized = String(value).trim();
      if (seen.has(normalized)) delete details[key];
      else seen.add(normalized);
    }
  }
  const enumKeys = new Set([
    'type',
    'direction',
    'proofStatus',
    'assetType',
    'loanType',
    'insuranceType',
    'subtype',
  ]);
  const facts: Record<string, unknown> = {
    category: wealthRecordTypeLabel(record),
  };
  for (const [key, value] of Object.entries(details)) {
    if (
      value == null ||
      value === '' ||
      (Array.isArray(value) && !value.length)
    )
      continue;
    if (
      /Ids?$|Code$/.test(key) ||
      [
        'recordKind',
        'category',
        'kind',
        'sourceDocumentCategory',
        'sourceDocumentType',
      ].includes(key)
    )
      continue;
    if (key === 'whatFor' && value === record.title) continue;
    const displayKey = key === 'type' ? 'recordType' : key;
    facts[displayKey] =
      enumKeys.has(key) && typeof value === 'string'
        ? value
            .toLowerCase()
            .replace(/_/g, ' ')
            .replace(/^./, char => char.toUpperCase())
        : value;
  }
  if (record.notes?.trim()) facts.notes = record.notes;
  if (record.followUpDate)
    facts.followUpDate = record.followUpDate.slice(0, 10);
  if (record.followUpNote?.trim()) facts.followUpNote = record.followUpNote;
  if (details.proofStatus === 'cash_no_record')
    facts.proofStatus = 'Cash payment without proof';
  facts.linkedDocuments = record.attachments?.length
    ? record.attachments.map(
        item => item.title || item.originalName || 'Document',
      )
    : 'None';
  if (record.loanBreakdown) {
    facts.loanSummary = Object.fromEntries(
      Object.entries(record.loanBreakdown).filter(([, value]) => value != null),
    );
  }
  return facts;
}
