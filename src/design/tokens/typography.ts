import { Platform } from 'react-native';

// Native counterpart of the web system-font stack: SF on iOS, Roboto on Android.
const systemFamily = Platform.OS === 'ios' ? 'System' : 'sans-serif';
export const fontFamilies = {
  regular: systemFamily,
  medium: systemFamily,
  semibold: systemFamily,
  bold: systemFamily,
} as const;
export const typography = {
  moduleTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  overviewTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 23,
    lineHeight: 32,
    fontWeight: '600',
  },
  metric: {
    fontFamily: fontFamilies.bold,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
  },
  compactLabel: {
    fontFamily: fontFamilies.semibold,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  action: {
    fontFamily: systemFamily,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
  rowTitle: {
    fontFamily: systemFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  navigation: {
    fontFamily: fontFamilies.regular,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '400',
  },
  display: {
    fontFamily: fontFamilies.bold,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600',
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
  },
  heading: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  label: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400',
  },
} as const;
export type TypographyVariant = keyof typeof typography;
