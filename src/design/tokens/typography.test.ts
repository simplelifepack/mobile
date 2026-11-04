import { fontFamilies, typography } from './typography';

describe('native system typography', () => {
  it('uses one system font family for every module and role', () => {
    expect(new Set(Object.values(fontFamilies)).size).toBe(1);
    for (const role of Object.values(typography)) {
      expect(role.fontFamily).toBe(fontFamilies.regular);
      expect(role.fontFamily).not.toMatch(/poppins/i);
      expect(Number(role.fontWeight)).toBeLessThanOrEqual(600);
    }
  });
  it('keeps record text light and gives labels and actions explicit weights', () => {
    expect(typography.rowTitle).toMatchObject({
      fontSize: 16,
      fontWeight: '400',
    });
    expect(typography.caption).toMatchObject({
      fontSize: 12,
      fontWeight: '400',
    });
    expect(typography.label.fontWeight).toBe('500');
    expect(typography.action.fontWeight).toBe('600');
    expect(typography.heading.fontWeight).toBe('600');
  });
});
