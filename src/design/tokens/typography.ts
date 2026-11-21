import { Platform, type TextStyle } from 'react-native';

const systemFamily = Platform.OS === 'ios' ? 'System' : 'sans-serif';
export const fontFamilies = {
  regular: systemFamily,
  medium: systemFamily,
  semibold: systemFamily,
  bold: systemFamily,
} as const;

type Role = Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing'>;
const role = (
  fontSize: number,
  lineHeight: number,
  fontWeight: TextStyle['fontWeight'],
): Role => ({ fontFamily: systemFamily, fontSize, lineHeight, fontWeight });

// Shared roles include the backup typography and additional sizes used by the app.
export const textRoles = {
  displayLg: role(34, 40, '600'),
  displayMd: role(32, 40, '600'),
  headingXl: role(28, 36, '600'),
  headingLg: role(23, 32, '600'),
  headingMd: role(20, 28, '600'),
  headingSm: role(18, 26, '600'),
  headingXs: role(15, 20, '600'),
  bodyLg: role(17, 24, '400'),
  bodyMd: role(14, 22, '400'),
  bodySm: role(13, 18, '400'),
  labelLg: role(16, 24, '400'),
  labelMd: role(16, 24, '400'),
  labelSm: role(14, 22, '500'),
  captionMd: role(12, 18, '400'),
  numericLg: role(24, 30, '600'),
  numericMd: role(20, 24, '600'),
} as const;

export type TextRole = keyof typeof textRoles;

// Component-facing variants follow the Foundations hierarchy recipe.
export const typography = {
  moduleTitle: textRoles.headingMd,
  overviewTitle: textRoles.headingLg,
  metric: textRoles.numericLg,
  compactLabel: role(13, 20, '600'),
  action: role(14, 22, '600'),
  rowTitle: textRoles.labelLg,
  navigation: role(10, 16, '400'),
  display: textRoles.displayMd,
  title: textRoles.headingXl, // screen title
  heading: textRoles.headingSm, // sheet, card and empty-state titles
  listTitle: textRoles.labelLg, // list-row title
  labelMd: textRoles.labelMd, // tile title, button label
  label: textRoles.labelSm,
  body: textRoles.bodyMd,
  bodySm: textRoles.bodySm, // row subtitle, helper and meta text
  caption: textRoles.captionMd, // chips
  eyebrow: { ...textRoles.captionMd, textTransform: 'uppercase', letterSpacing: 0.6 }, // section and field labels
  numeric: textRoles.numericLg, // large number
  amount: textRoles.numericMd, // inline number
} as const;

export type TypographyVariant = keyof typeof typography;

export const fontSize = {
  caption: textRoles.captionMd.fontSize,
  bodySm: textRoles.bodySm.fontSize,
  body: textRoles.bodyMd.fontSize,
  headingSm: textRoles.headingSm.fontSize,
  headingMd: textRoles.headingMd.fontSize,
  headingLg: textRoles.headingLg.fontSize,
  headingXl: textRoles.headingXl.fontSize,
  displayMd: textRoles.displayMd.fontSize,
  displayLg: textRoles.displayLg.fontSize,
} as const;

export const lineHeight = {
  caption: textRoles.captionMd.lineHeight,
  bodySm: textRoles.bodySm.lineHeight,
  body: textRoles.bodyMd.lineHeight,
  headingSm: textRoles.headingSm.lineHeight,
  headingMd: textRoles.headingMd.lineHeight,
  headingLg: textRoles.headingLg.lineHeight,
  headingXl: textRoles.headingXl.lineHeight,
  displayMd: textRoles.displayMd.lineHeight,
  displayLg: textRoles.displayLg.lineHeight,
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '600',
} as const;
