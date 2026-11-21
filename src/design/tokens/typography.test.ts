import { Platform } from 'react-native';
import { fontFamilies, fontWeights, typography } from './typography';

describe('shared typography', () => {
  it('uses the native system font across all roles', () => {
    const family = Platform.OS === 'ios' ? 'System' : 'sans-serif';
    expect(Object.values(fontFamilies)).toEqual([family, family, family, family]);
    Object.values(typography).forEach(style => {
      expect(style.fontFamily).toBe(family);
    });
  });

  it.each([
    ['moduleTitle', 20, 28, '600'],
    ['overviewTitle', 23, 32, '600'],
    ['metric', 24, 30, '600'],
    ['compactLabel', 13, 20, '600'],
    ['action', 14, 22, '600'],
    ['rowTitle', 16, 24, '400'],
    ['navigation', 10, 16, '400'],
    ['display', 32, 40, '600'],
    ['title', 28, 36, '600'],
    ['heading', 18, 26, '600'],
    ['body', 14, 22, '400'],
    ['label', 14, 22, '500'],
    ['caption', 12, 18, '400'],
  ] as const)('%s matches the backup style', (name, fontSize, lineHeight, fontWeight) => {
    expect(typography[name]).toMatchObject({ fontSize, lineHeight, fontWeight });
  });

  it('uses the backup weights for explicit component styles', () => {
    expect(fontWeights).toEqual({
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '600',
    });
  });
});
