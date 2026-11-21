import type { DocumentRecord } from '../../api/types';

const MAX_RECENT_DOCUMENTS = 5;

let recentlyViewedDocuments: DocumentRecord[] = [];
const listeners = new Set<() => void>();

export function getRecentlyViewedDocuments() {
  return recentlyViewedDocuments;
}

export function subscribeToRecentlyViewedDocuments(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function recordRecentlyViewedDocument(document: DocumentRecord) {
  recentlyViewedDocuments = [
    document,
    ...recentlyViewedDocuments.filter(item => item.id !== document.id),
  ].slice(0, MAX_RECENT_DOCUMENTS);
  listeners.forEach(listener => listener());
}
