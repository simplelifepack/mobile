import type { ThemeColors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { shadows } from '../tokens/shadows';
import { sizes } from '../tokens/sizes';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';
export type ThemeMode = 'system' | 'light' | 'dark';
export type AppTheme = {
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  sizes: typeof sizes;
  shadows: typeof shadows;
};
export type { ThemeColors };
