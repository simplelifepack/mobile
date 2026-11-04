import type { DocumentRecord, ReviewField } from '../../api/web.types';
function fieldsObject(document: DocumentRecord) {
  return document.fields && typeof document.fields === 'object'
    ? (document.fields as Record<string, unknown>)
    : {};
}
function reviewFields(document: DocumentRecord): ReviewField[] {
  const value = fieldsObject(document).reviewFields;
  return Array.isArray(value) ? (value as ReviewField[]) : [];
}
function safeCategory(category: string) {
  return category.toLowerCase();
}
function expiryValue(document: DocumentRecord) {
  return document.expiryDate || null;
}

export type QuickFilter = 'all' | 'soon' | 'expired' | 'week' | 'proofs';
export type DocumentSort = 'newest' | 'oldest' | 'name-asc' | 'name-desc';

export function documentPerson(
  document: DocumentRecord,
  currentUserName?: string,
) {
  const fields = fieldsObject(document);
  const assigned = fields.assignedPerson;
  if (
    assigned &&
    typeof assigned === 'object' &&
    'name' in assigned &&
    typeof assigned.name === 'string' &&
    assigned.name.trim()
  )
    return assigned.name.trim();
  const direct = [
    'nameOnDocument',
    'holderName',
    'ownerName',
    'insuredName',
    'customerName',
    'employeeName',
    'studentName',
    'patientName',
    'name',
  ]
    .map(key => fields[key])
    .find(
      (value): value is string =>
        typeof value === 'string' && Boolean(value.trim()),
    );
  const reviewed = reviewFields(document).find(field =>
    /^(full\s+)?name(\s+on\s+document)?$|^(card)?holder(\s+name)?$|^(owner|insured|patient|employee|student)(\s+name)?$/i.test(
      field.label.trim(),
    ),
  )?.value;
  return direct?.trim() || reviewed?.trim() || currentUserName?.trim() || 'You';
}

export function documentSource(document: DocumentRecord) {
  if (document.sourceProvider === 'DIGILOCKER') return 'digilocker';
  if (document.source === 'GMAIL') return 'gmail';
  if (document.source === 'GOOGLE_DRIVE') return 'drive';
  if (String(document.source) === 'SCAN' || document.sourceProvider === 'SCAN')
    return 'scanned';
  return 'uploaded';
}

export const sourceNames: Record<string, string> = {
  uploaded: 'Uploaded',
  scanned: 'Scanned',
  gmail: 'Gmail',
  drive: 'Google Drive',
  digilocker: 'DigiLocker',
};

function expiryTime(document: DocumentRecord) {
  const value = expiryValue(document);
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

export function matchesQuickFilter(
  document: DocumentRecord,
  filter: QuickFilter,
  now = Date.now(),
) {
  if (filter === 'all') return true;
  if (filter === 'proofs') {
    return /transaction[ _-]*evidence|payment[ _-]*proof|proof[ _-]*of[ _-]*payment/i.test(
      document.documentType ?? '',
    );
  }
  if (filter === 'week') {
    const added = new Date(document.createdAt).getTime();
    return (
      Number.isFinite(added) && added >= now - 7 * 86400000 && added <= now
    );
  }
  const expiry = expiryTime(document);
  if (expiry == null) return false;
  if (filter === 'expired') return expiry < now;
  return expiry >= now && expiry <= now + 30 * 86400000;
}

export function filterDocuments(
  documents: DocumentRecord[],
  options: {
    query: string;
    category: string;
    person: string;
    source: string;
    sort: DocumentSort;
    quick: QuickFilter;
    currentUserName?: string;
  },
) {
  const query = options.query.trim().toLocaleLowerCase();
  return documents
    .filter(document => {
      const person = documentPerson(document, options.currentUserName);
      if (
        options.category !== 'all' &&
        safeCategory(document.category) !== options.category
      )
        return false;
      if (options.person !== 'all' && person !== options.person) return false;
      if (
        options.source !== 'all' &&
        documentSource(document) !== options.source
      )
        return false;
      if (!matchesQuickFilter(document, options.quick)) return false;
      return (
        !query ||
        [
          document.title,
          document.displayName,
          document.originalName,
          document.documentType,
          document.category,
          document.uniqueIdentifier,
          document.source,
          person,
        ].some(value =>
          String(value ?? '')
            .toLocaleLowerCase()
            .includes(query),
        )
      );
    })
    .sort((a, b) => {
      if (options.sort === 'name-asc' || options.sort === 'name-desc') {
        const comparison = (
          a.displayName ||
          a.title ||
          a.originalName
        ).localeCompare(b.displayName || b.title || b.originalName);
        return options.sort === 'name-asc' ? comparison : -comparison;
      }
      const comparison =
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (
        (options.sort === 'newest' ? comparison : -comparison) ||
        a.id.localeCompare(b.id)
      );
    });
}
