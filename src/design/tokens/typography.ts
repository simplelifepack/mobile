import type { TextStyle } from 'react-native';

type Role = Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing'>;
const role = (fontSize: number, lineHeight: number, fontWeight: TextStyle['fontWeight']): Role => ({
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing: 0,
});

// Design System 1.0 text roles. Nothing is below the 12px caption floor.
export const textRoles = {
  displayLg: role(34, 40, '700'),
  displayMd: role(28, 34, '700'),
  headingXl: role(24, 30, '700'),
  headingLg: role(22, 28, '600'),
  headingMd: role(20, 26, '600'),
  headingSm: role(17, 22, '600'),
  headingXs: role(15, 20, '600'),
  bodyLg: role(17, 24, '400'),
  bodyMd: role(15, 22, '400'),
  bodySm: role(13, 18, '400'),
  labelLg: role(17, 22, '500'),
  labelMd: role(15, 20, '500'),
  labelSm: role(13, 16, '500'),
  captionMd: role(12, 16, '500'),
  numericLg: role(28, 34, '700'),
  numericMd: role(20, 24, '600'),
} as const;

export type TextRole = keyof typeof textRoles;

// Component-facing variants map onto the Design System roles.
export const typography = {
  display: textRoles.displayMd,
  title: textRoles.headingLg,
  heading: textRoles.headingSm,
  body: textRoles.bodyMd,
  label: textRoles.labelSm,
  caption: textRoles.captionMd,
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
