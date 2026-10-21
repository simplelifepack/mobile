import { darkColors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { shadows } from '../tokens/shadows';
import { sizes } from '../tokens/sizes';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';
import type { AppTheme } from './types';
export const darkTheme: AppTheme = {
  isDark: true,
  spacing,
  radius,
  typography,
  sizes,
  shadows,
  colors: darkColors,
};
