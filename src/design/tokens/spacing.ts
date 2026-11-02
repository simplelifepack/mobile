export const space = {
  0: 0,
  2: 2,
  4: 4,
  6: 6,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
} as const;

export const spacing = {
  xs: space[4],
  sm: space[8],
  md: space[16],
  lg: space[24],
  xl: space[32],
  xxl: space[48],
} as const;
export type SpacingToken = keyof typeof spacing;

// Design System page layout tokens.
export const layout = {
  gutter: space[16],
  sectionGap: space[24],
  contentWidth: 600,
} as const;
