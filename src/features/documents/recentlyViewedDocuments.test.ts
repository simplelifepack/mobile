import type { DocumentRecord } from '../../api/types';
import {
  getRecentlyViewedDocuments,
  recordRecentlyViewedDocument,
  subscribeToRecentlyViewedDocuments,
} from './recentlyViewedDocuments';

const document = (id: string): DocumentRecord => ({
  id,
  originalName: `${id}.pdf`,
  documentType: 'Other',
  classificationStatus: 'detected',
  ownershipStatus: 'unknown',
  confidence: 90,
  createdAt: '',
});

it('tracks opened documents newest-first, moves reopened documents to the front, and caps the list', () => {
  const listener = jest.fn();
  const unsubscribe = subscribeToRecentlyViewedDocuments(listener);

  recordRecentlyViewedDocument(document('doc-1'));
  recordRecentlyViewedDocument(document('doc-2'));
  recordRecentlyViewedDocument(document('doc-1'));
  recordRecentlyViewedDocument(document('doc-3'));
  recordRecentlyViewedDocument(document('doc-4'));
  recordRecentlyViewedDocument(document('doc-5'));
  recordRecentlyViewedDocument(document('doc-6'));

  expect(getRecentlyViewedDocuments().map(item => item.id)).toEqual([
    'doc-6',
    'doc-5',
    'doc-4',
    'doc-3',
    'doc-1',
  ]);
  expect(listener).toHaveBeenCalledTimes(7);
  unsubscribe();
});
