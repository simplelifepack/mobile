/** The API stores editable metadata inside fields; expose it consistently to native screens. */
export function normalizeDocument<
  T extends {
    fields?: unknown;
    owner?: string;
    expiryDate?: string | null;
    documentDate?: string | null;
    capabilities?: string[];
    ownershipStatus?: string;
  },
>(
  document: T,
): T & {
  owner: string;
  expiryDate: string | null;
  documentDate: string | null;
  capabilities: string[];
} {
  const fields =
    document.fields &&
    typeof document.fields === 'object' &&
    !Array.isArray(document.fields)
      ? (document.fields as Record<string, unknown>)
      : {};
  const text = (...keys: string[]) =>
    keys
      .map(key => fields[key])
      .find(
        (value): value is string =>
          typeof value === 'string' && Boolean(value.trim()),
      );
  const expiryDate = Object.prototype.hasOwnProperty.call(fields, 'userExpiry')
    ? typeof fields.userExpiry === 'string'
      ? fields.userExpiry
      : null
    : (document.expiryDate ??
      text('expiry', 'dateOfExpiry', 'validTill', 'validUntil', 'endDate'));
  return {
    ...document,
    owner:
      document.owner ??
      text('owner') ??
      (document.ownershipStatus === 'verified' ? 'self' : 'unknown'),
    expiryDate: expiryDate ?? null,
    documentDate:
      document.documentDate ??
      text('documentDate', 'dateOfIssue', 'issueDate') ??
      null,
    capabilities:
      document.capabilities ??
      (Array.isArray(fields.capabilities)
        ? fields.capabilities.filter(
            (value): value is string => typeof value === 'string',
          )
        : []),
  };
}
