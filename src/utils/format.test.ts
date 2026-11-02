import { formatDate, humanizeLabel } from './format';

describe('format helpers', () => {
  it('humanizes raw enum values', () => {
    expect(humanizeLabel('PARENT')).toBe('Parent');
    expect(humanizeLabel('NEXT_OF_KIN')).toBe('Next of kin');
    expect(humanizeLabel(undefined)).toBe('');
  });

  it('returns an empty string for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('');
    expect(formatDate(null)).toBe('');
  });

  it('formats valid dates with year and day', () => {
    expect(formatDate('2026-03-07T12:00:00Z')).toMatch(/2026/);
  });
});
