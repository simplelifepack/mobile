import { lightColors } from '../tokens/colors';
import { radius } from '../tokens/radius';
import { shadows } from '../tokens/shadows';
import { sizes } from '../tokens/sizes';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';
import type { AppTheme } from './types';
export const lightTheme: AppTheme = {
  isDark: false,
  spacing,
  radius,
  typography,
  sizes,
  shadows,
  colors: lightColors,
};
