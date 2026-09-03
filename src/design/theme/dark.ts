import { palette } from '../tokens/colors';
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
  colors: {
    background: palette.navy950,
    surface: palette.navy900,
    surfaceElevated: palette.navy800,
    textPrimary: palette.white,
    textSecondary: palette.gray300,
    textMuted: palette.gray500,
    border: palette.navy800,
    primary: palette.blue400,
    primaryPressed: palette.blue600,
    onPrimary: palette.navy950,
    success: palette.green500,
    warning: palette.amber500,
    danger: palette.red500,
    overlay: 'rgba(0, 0, 0, 0.72)',
  },
};
