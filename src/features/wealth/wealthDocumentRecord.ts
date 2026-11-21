import type { DocumentAnalysisResponse, DocumentRecord } from '../../api/types';
import type {
  WealthRecordPayload,
  WealthRecordType,
} from '../../api/wealth.api';

type AnalyzedDocument = DocumentAnalysisResponse['document'];

function analysisText(document: AnalyzedDocument) {
  return `${document.category ?? ''} ${document.documentType ?? ''} ${document.title ?? ''}`
    .toLowerCase()
    .replace(/[_-]+/g, ' ');
}

export function wealthRecordTypeForDocument(
  document: AnalyzedDocument,
): WealthRecordType | undefined {
  const text = analysisText(document);
  if (/\b(insurance|policy|insurer|sum assured|cover note)\b/.test(text)) {
    return 'INSURANCE';
  }
  if (/\b(loan|mortgage|credit card|line of credit)\b/.test(text)) {
    return 'LOAN_TAKEN';
  }
  if (
    /\b(bank statement|savings account|current account|fixed deposit|term deposit|deposit receipt|passbook|mutual fund|investment|stock|share certificate|demat|portfolio|bond|nps|provident fund|epf|ppf|property deed|title deed|sale deed|asset statement)\b/.test(
      text,
    )
  ) {
    return 'ASSET';
  }
  return undefined;
}

function fieldValue(fields: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = fields[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return '';
}

export function wealthRecordPayloadFromDocument(
  saved: DocumentRecord,
  analysis: AnalyzedDocument,
): WealthRecordPayload | undefined {
  const type = wealthRecordTypeForDocument(analysis);
  if (!type) return undefined;

  const fields = {
    ...(saved.fields ?? {}),
    ...(analysis.fields ?? {}),
  };
  (analysis.reviewFields ?? []).forEach(field => {
    const key = field.key ?? field.label;
    if (typeof key === 'string' && key && field.value != null) {
      fields[key] = field.value;
    }
  });
  const institution = fieldValue(fields, [
    'institution',
    'issuer',
    'bankName',
    'provider',
    'insurerName',
  ]);
  const reference = fieldValue(fields, [
    'accountNumberMasked',
    'accountNumber',
    'policyNumber',
    'loanAccountNumber',
    'referenceNumber',
  ]);
  const amount = fieldValue(fields, [
    'balance',
    'currentBalance',
    'marketValue',
    'coverageAmount',
    'sumAssured',
    'outstanding',
    'principalAmount',
    'amount',
    'totalAmount',
    'value',
  ]);
  const currency = fieldValue(fields, ['currency']) || 'INR';
  const subtypeKey =
    type === 'INSURANCE'
      ? 'insuranceType'
      : type === 'LOAN_TAKEN'
        ? 'loanType'
        : 'assetType';

  const details: WealthRecordPayload['details'] = {
    sourceDocumentId: saved.id,
    sourceDocumentCategory: saved.category ?? analysis.category ?? 'Other',
    sourceDocumentType:
      saved.documentType || analysis.documentType || 'Unknown',
    memberId: 'you',
    currency,
    [subtypeKey]: analysis.documentType || '',
    type: analysis.documentType || '',
    institution,
    provider: institution,
    accountRef: reference,
    amount,
  };

  const renewalDate = fieldValue(fields, [
    'renewalDate',
    'expiryDate',
    'validUntil',
    'validTill',
  ]);
  const maturityDate = fieldValue(fields, ['maturityDate', 'dueDate']);
  const coverageAmount = fieldValue(fields, ['coverageAmount', 'sumAssured']);
  const nomineeName = fieldValue(fields, ['nomineeName', 'nominee']);
  if (renewalDate) details.renewalDate = renewalDate;
  if (maturityDate) details.maturityDate = maturityDate;
  if (coverageAmount) details.coverageAmount = coverageAmount;
  if (nomineeName) {
    details.nominee = nomineeName;
    details.nomineeName = nomineeName;
  }

  return {
    type,
    title: (
      saved.displayName ??
      saved.title ??
      analysis.title ??
      saved.originalName
    )
      .trim()
      .slice(0, 160),
    details,
    attachmentDocumentIds: [saved.id],
  };
}
