export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: 0 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: 0 },
  heading: { fontSize: 16, lineHeight: 22, fontWeight: '600', letterSpacing: 0 },
  body: { fontSize: 13, lineHeight: 19, fontWeight: '400', letterSpacing: 0 },
  label: { fontSize: 13, lineHeight: 17, fontWeight: '600', letterSpacing: 0 },
  caption: { fontSize: 11, lineHeight: 14, fontWeight: '500', letterSpacing: 0 },
} as const;
export type TypographyVariant = keyof typeof typography;
