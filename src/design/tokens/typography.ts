export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: 0 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: 0 },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600', letterSpacing: 0 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400', letterSpacing: 0 },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '500', letterSpacing: 0 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0 },
} as const;
export type TypographyVariant = keyof typeof typography;
