import { normalizeGlobalSearchQuery } from './searchQuery';
it.each(['aadhar', 'adhar', 'adhaar', 'aadhaar', 'AADHAR'])(
  'finds canonical Aadhaar records for %s',
  query => {
    expect(normalizeGlobalSearchQuery(query).toLowerCase()).toBe('aadhaar');
  },
);
it('normalizes complete words without changing names or unrelated searches', () => {
  expect(normalizeGlobalSearchQuery(' aadhar card ')).toBe('aadhaar card');
  expect(normalizeGlobalSearchQuery('Aadharsingh')).toBe('Aadharsingh');
  expect(normalizeGlobalSearchQuery('Passport renewal')).toBe(
    'Passport renewal',
  );
  expect(normalizeGlobalSearchQuery('a'.repeat(200))).toHaveLength(160);
});
