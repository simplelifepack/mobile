import type { TextStyle } from 'react-native';

type Role = Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing'>;
const role = (
  fontSize: number,
  lineHeight: number,
  fontWeight: TextStyle['fontWeight'],
  letterSpacing = 0,
): Role => ({ fontSize, lineHeight, fontWeight, letterSpacing });

// Design System 1.0 text roles. Nothing is below the 12px caption floor.
export const textRoles = {
  displayLg: role(34, 40, '500', -0.6),
  displayMd: role(28, 34, '500', -0.4),
  headingXl: role(24, 30, '500', -0.3),
  headingLg: role(22, 28, '500', -0.3),
  headingMd: role(20, 26, '500', -0.2),
  headingSm: role(17, 22, '500', -0.2),
  headingXs: role(15, 20, '500', -0.1),
  bodyLg: role(17, 24, '400', -0.1),
  bodyMd: role(15, 22, '400'),
  bodySm: role(13, 18, '400'),
  labelLg: role(17, 22, '400', -0.1),
  labelMd: role(15, 20, '400'),
  labelSm: role(13, 16, '400'),
  captionMd: role(12, 16, '400'),
  numericLg: role(28, 34, '500', -0.4),
  numericMd: role(20, 24, '500', -0.2),
} as const;

export type TextRole = keyof typeof textRoles;

// Component-facing variants follow the Foundations hierarchy recipe.
export const typography = {
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
  medium: '400',
  semibold: '500',
  bold: '500',
} as const;
