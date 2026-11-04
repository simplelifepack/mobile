import { correctedSearch, nextSearch } from './searchRecovery';
it('corrects only unique one-edit document terms and preserves names and identifiers', () => {
  expect(correctedSearch('passpor')).toBe('passport');
  expect(correctedSearch('aadhaar')).toBe('aadhaar');
  expect(correctedSearch('Ranjith 123456PAN')).toBe('Ranjith 123456PAN');
  expect(correctedSearch('pan')).toBe('pan');
  expect(nextSearch('passport renewal')).toBe('passport');
  expect(nextSearch('passpor')).toBe('passport');
});
