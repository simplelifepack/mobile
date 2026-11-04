import { lightColorTokens as colors } from '../tokens/colorTokens';
import { dashboardLight } from '../tokens/dashboard';
import { radius } from '../tokens/radius';
import { shadows } from '../tokens/shadows';
import { sizes } from '../tokens/sizes';
import { spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';
import type { AppTheme } from './types';
export const lightTheme: AppTheme = {
  isDark: false,
  dashboard: dashboardLight,
  spacing,
  radius,
  typography,
  sizes,
  shadows,
  colors: {
    background: dashboardLight.background,
    surface: dashboardLight.surface,
    surfaceElevated: dashboardLight.elevated,
    textInteractive: colors['text-interactive'],
    textDisabled: colors['text-disabled'],
    textPrimary: dashboardLight.text,
    textSecondary: dashboardLight.muted,
    textMuted: dashboardLight.subtle,
    border: dashboardLight.border,
    controlBorder: colors['border-emphasis'],
    primarySoft: dashboardLight.accentSoft,
    readiness: dashboardLight.accent,
    brandAccent: dashboardLight.accent,
    primary: dashboardLight.accent,
    primaryPressed: colors['action-primary-pressed'],
    onPrimary: dashboardLight.onAccent,
    success: dashboardLight.success,
    warning: dashboardLight.warning,
    danger: dashboardLight.danger,
    overlay: colors['overlay-backdrop'],
  },
};
