import {
  documentPerson,
  filterDocuments,
  matchesQuickFilter,
} from './documentFilters';
import { normalizeDocument } from '../../api/normalizeDocument';
import type { DocumentRecord } from '../../api/web.types';
const now = Date.parse('2026-10-26T12:00:00Z');
const record = (id: string, changes: Partial<DocumentRecord> = {}) =>
  normalizeDocument({
    id,
    documentType: 'Passport',
    originalName: `${id}.pdf`,
    category: 'identity',
    createdAt: '2026-10-25T12:00:00Z',
    fields: {},
    source: 'MANUAL_UPLOAD',
    ...changes,
  } as DocumentRecord);
it('keeps expired, soon, week and proof filters consistent with web', () => {
  const expired = record('expired', { expiryDate: '2026-10-25T12:00:00Z' });
  expect(matchesQuickFilter(expired, 'expired', now)).toBe(true);
  expect(matchesQuickFilter(expired, 'soon', now)).toBe(false);
  expect(
    matchesQuickFilter(
      record('soon', { expiryDate: '2026-11-10' }),
      'soon',
      now,
    ),
  ).toBe(true);
  expect(
    matchesQuickFilter(
      record('later', { expiryDate: '2026-12-10' }),
      'soon',
      now,
    ),
  ).toBe(false);
  expect(matchesQuickFilter(record('recent'), 'week', now)).toBe(true);
  expect(
    matchesQuickFilter(
      record('proof', { documentType: 'proof_of_payment' }),
      'proofs',
      now,
    ),
  ).toBe(true);
});
it('uses assigned people and source filters and sorts a copy', () => {
  const records = [
    record('Z', {
      fields: { assignedPerson: { name: 'Alex' } },
      source: 'GMAIL',
    }),
    record('A'),
  ];
  expect(documentPerson(records[0], 'You')).toBe('Alex');
  const options = {
    query: 'alex',
    category: 'identity',
    person: 'Alex',
    source: 'gmail',
    sort: 'newest' as const,
    quick: 'all' as const,
  };
  expect(filterDocuments(records, options).map(item => item.id)).toEqual(['Z']);
  expect(
    filterDocuments(records, {
      ...options,
      query: '',
      source: 'all',
      person: 'all',
      sort: 'name-asc',
    }).map(item => item.id),
  ).toEqual(['A', 'Z']);
  expect(records.map(item => item.id)).toEqual(['Z', 'A']);
});
