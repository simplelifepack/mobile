import type { DocumentRecord, WealthRecordPayload } from '../../api/web.types';
export function documentDefaults(document?: DocumentRecord) {
  const fields = (document?.fields ?? {}) as Record<string, unknown>;
  const read = (...keys: string[]) => {
    for (const key of keys) {
      const value = fields[key];
      if (value != null && value !== '') return String(value);
    }
    const reviews = Array.isArray(fields.reviewFields)
      ? (fields.reviewFields as Array<{ key?: string; value?: unknown }>)
      : [];
    const found = reviews.find(item => keys.includes(item.key ?? ''));
    return found?.value == null ? '' : String(found.value);
  };
  const kind = /insurance|policy|cover/i.test(
    `${document?.category} ${document?.documentType}`,
  )
    ? 'cover'
    : /loan|mortgage|liability|credit/i.test(document?.documentType ?? '')
      ? 'liability'
      : 'asset';
  return {
    title:
      document?.displayName || document?.title || document?.originalName || '',
    kind,
    type: document?.documentType ?? '',
    institution: read(
      'institution',
      'issuer',
      'bankName',
      'provider',
      'insurerName',
    ),
    accountRef: read(
      'accountNumber',
      'accountNumberMasked',
      'policyNumber',
      'referenceNumber',
      'loanAccountNumber',
    ),
    amount: read(
      'amount',
      'marketValue',
      'coverageAmount',
      'sumAssured',
      'principalAmount',
      'value',
    ),
    currency: read('currency') || 'INR',
    renewalDate: read('renewalDate', 'expiryDate', 'validTill', 'validUntil'),
    maturityDate: read('maturityDate'),
  };
}

export function entryPayload(
  mode: 'holding' | 'money',
  values: Record<string, string>,
  documentId?: string,
): WealthRecordPayload {
  const amount = values.amount.trim() ? Number(values.amount) : null;
  if (
    amount !== null &&
    (!Number.isFinite(amount) ||
      amount < 0 ||
      (mode === 'money' && amount <= 0))
  )
    throw new Error(
      'Enter a valid amount. Money lent or borrowed must be greater than zero.',
    );
  if (!/^[A-Z]{3}$/.test(values.currency))
    throw new Error('Choose a three-letter currency code.');
  const money = mode === 'money';
  const type = money
    ? values.direction === 'BORROWED'
      ? 'LOAN_TAKEN'
      : 'LOAN_GIVEN'
    : values.kind === 'cover'
      ? 'INSURANCE'
      : values.kind === 'liability'
        ? 'LOAN_TAKEN'
        : 'ASSET';
  return {
    type,
    title: values.title.trim(),
    notes: money ? values.followUpNote : values.accessInstruction,
    followUpDate: money ? values.followUpDate || null : null,
    followUpNote: money ? values.followUpNote : '',
    attachmentDocumentIds: documentId ? [documentId] : [],
    details: money
      ? {
          recordKind: 'money_lent_borrowed',
          direction: values.direction,
          whatFor: values.title.trim(),
          who: values.who,
          party: values.who,
          paidTo: values.direction === 'LENT' ? values.who : '',
          receivedFrom: values.direction === 'BORROWED' ? values.who : '',
          amount,
          principalAmount: amount,
          currency: values.currency,
          transactionDate: values.date,
          date: values.date,
          followUpOn: values.followUpDate,
          proofStatus: documentId ? 'attached' : 'cash_no_record',
          sourceDocumentId: documentId ?? '',
        }
      : {
          categoryCode:
            values.kind === 'cover'
              ? 'insurance'
              : values.kind === 'liability'
                ? 'loan'
                : 'asset',
          type: values.type,
          assetType: values.kind === 'asset' ? values.type : '',
          loanType: values.kind === 'liability' ? values.type : '',
          insuranceType: values.kind === 'cover' ? values.type : '',
          provider: values.institution,
          institution: values.institution,
          accountRef: values.accountRef,
          memberId: values.memberId,
          amount,
          value: amount,
          principalAmount: amount,
          coverageAmount: amount,
          currency: values.currency,
          renewalDate: values.renewalDate,
          maturityDate: values.maturityDate,
          accessInstruction: values.accessInstruction,
          nominee: values.nomineeName,
          nomineeName: values.nomineeName,
        },
  };
}
