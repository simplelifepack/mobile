import { palette } from '../tokens/colors';
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
  colors: {
    background: palette.gray50,
    surface: palette.white,
    surfaceElevated: palette.white,
    textPrimary: palette.gray900,
    textSecondary: palette.gray700,
    textMuted: palette.gray500,
    border: palette.gray100,
    primary: palette.blue600,
    primaryPressed: palette.blue700,
    onPrimary: palette.white,
    success: palette.green500,
    warning: palette.amber500,
    danger: palette.red500,
    overlay: 'rgba(10, 14, 20, 0.55)',
  },
};
