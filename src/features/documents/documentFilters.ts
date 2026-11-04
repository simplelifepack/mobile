import type { DocumentRecord } from '../../api/types';
import { documentExpiry } from './documentDetails';

export type QuickFilter = 'all' | 'soon' | 'expired' | 'week' | 'proofs';
export type DocumentSort = 'newest' | 'oldest' | 'name' | 'expiry';

export type DocumentFilters = {
  quick: QuickFilter;
  category: string;
  person: string;
  sort: DocumentSort;
};

export const ALL = 'all';

export const defaultFilters: DocumentFilters = {
  quick: 'all',
  category: ALL,
  person: ALL,
  sort: 'newest',
};

export const quickFilterLabels: Array<[QuickFilter, string]> = [
  ['all', 'All'],
  ['soon', 'Expiring soon'],
  ['expired', 'Expired'],
  ['week', 'Added this week'],
  ['proofs', 'Proofs'],
];

export const sortLabels: Array<[DocumentSort, string]> = [
  ['newest', 'Newest first'],
  ['oldest', 'Oldest first'],
  ['name', 'By name'],
  ['expiry', 'By expiry'],
];

const DAY_MS = 86_400_000;
const EXPIRING_SOON_DAYS = 30;

export const documentCategory = (document: DocumentRecord) =>
  document.category?.trim() || 'Other';

export function documentPersonName(document: DocumentRecord) {
  const assigned = document.fields?.assignedPerson as { name?: string } | undefined;
  return assigned?.name?.trim() || 'You';
}

const documentName = (document: DocumentRecord) =>
  document.displayName ?? document.title ?? document.originalName;

function expiryTime(document: DocumentRecord) {
  const value = documentExpiry(document);
  return value ? new Date(`${value}T00:00:00`).getTime() : undefined;
}

export function matchesQuickFilter(document: DocumentRecord, quick: QuickFilter, now = Date.now()) {
  if (quick === 'all') return true;
  if (quick === 'proofs') {
    return /transaction[ _-]*evidence|payment[ _-]*proof|proof[ _-]*of[ _-]*payment/i.test(
      document.documentType ?? '',
    );
  }
  if (quick === 'week') {
    const added = new Date(document.createdAt).getTime();
    return Number.isFinite(added) && added >= now - 7 * DAY_MS && added <= now;
  }
  const expiry = expiryTime(document);
  if (expiry === undefined) return false;
  if (quick === 'expired') return expiry < now;
  return expiry >= now && expiry <= now + EXPIRING_SOON_DAYS * DAY_MS;
}

export function activeFilterCount(filters: DocumentFilters) {
  return (
    Number(filters.quick !== 'all') +
    Number(filters.category !== ALL) +
    Number(filters.person !== ALL) +
    Number(filters.sort !== defaultFilters.sort)
  );
}

export function applyDocumentFilters(documents: DocumentRecord[], filters: DocumentFilters) {
  return documents
    .filter(
      document =>
        (filters.category === ALL || documentCategory(document) === filters.category) &&
        (filters.person === ALL || documentPersonName(document) === filters.person) &&
        matchesQuickFilter(document, filters.quick),
    )
    .sort((a, b) => {
      if (filters.sort === 'name') return documentName(a).localeCompare(documentName(b));
      if (filters.sort === 'expiry') {
        return (expiryTime(a) ?? Infinity) - (expiryTime(b) ?? Infinity);
      }
      const byDate = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return filters.sort === 'newest' ? byDate : -byDate;
    });
}
