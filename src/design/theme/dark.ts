import { darkColorTokens as colors } from '../tokens/colorTokens';
import { dashboardDark } from '../tokens/dashboard';
import { radius } from '../tokens/radius';
import { darkShadows as shadows } from '../tokens/shadows';
import { sizes } from '../tokens/sizes';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';
import type { AppTheme } from './types';
export const darkTheme: AppTheme = {
  isDark: true,
  dashboard: dashboardDark,
  spacing,
  radius,
  typography,
  sizes,
  shadows,
  colors: {
    background: dashboardDark.background,
    surface: dashboardDark.surface,
    surfaceElevated: dashboardDark.elevated,
    textInteractive: colors['text-interactive'],
    textDisabled: colors['text-disabled'],
    textPrimary: dashboardDark.text,
    textSecondary: dashboardDark.muted,
    textMuted: dashboardDark.subtle,
    border: dashboardDark.border,
    controlBorder: colors['border-emphasis'],
    primarySoft: dashboardDark.accentSoft,
    readiness: dashboardDark.accent,
    brandAccent: dashboardDark.accent,
    primary: dashboardDark.accent,
    primaryPressed: colors['action-primary-pressed'],
    onPrimary: dashboardDark.onAccent,
    success: dashboardDark.success,
    warning: dashboardDark.warning,
    danger: dashboardDark.danger,
    overlay: colors['overlay-backdrop'],
  },
};
