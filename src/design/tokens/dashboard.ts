import { lightColorTokens, darkColorTokens } from './colorTokens';

// Native dashboard roles mapped to the supplied semantic color tokens.
export type DashboardColors = {
  background: string;
  surface: string;
  elevated: string;
  border: string;
  text: string;
  muted: string;
  subtle: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  info: string;
  infoSoft: string;
  health: string;
  navigation: string;
};
export const dashboardDark: DashboardColors = {
  background: darkColorTokens['surface-canvas'],
  surface: darkColorTokens['surface-default'],
  elevated: darkColorTokens['surface-raised'],
  border: darkColorTokens['border-default'],
  text: darkColorTokens['text-primary'],
  muted: darkColorTokens['text-secondary'],
  subtle: darkColorTokens['text-tertiary'],
  accent: darkColorTokens['action-primary-default'],
  accentSoft: darkColorTokens['surface-brand-tint'],
  onAccent: darkColorTokens['text-on-brand'],
  danger: darkColorTokens['status-danger-icon'],
  dangerSoft: darkColorTokens['status-danger-surface'],
  success: darkColorTokens['status-success-icon'],
  successSoft: darkColorTokens['status-success-surface'],
  warning: darkColorTokens['status-warning-icon'],
  warningSoft: darkColorTokens['status-warning-surface'],
  info: darkColorTokens['status-info-icon'],
  infoSoft: darkColorTokens['status-info-surface'],
  health: darkColorTokens['person-4'],
  navigation: darkColorTokens['surface-secondary'],
};
export const dashboardLight: DashboardColors = {
  background: lightColorTokens['surface-canvas'],
  surface: lightColorTokens['surface-default'],
  elevated: lightColorTokens['surface-raised'],
  border: lightColorTokens['border-default'],
  text: lightColorTokens['text-primary'],
  muted: lightColorTokens['text-secondary'],
  subtle: lightColorTokens['text-tertiary'],
  accent: lightColorTokens['action-primary-default'],
  accentSoft: lightColorTokens['surface-brand-tint'],
  onAccent: lightColorTokens['text-on-brand'],
  danger: lightColorTokens['status-danger-icon'],
  dangerSoft: lightColorTokens['status-danger-surface'],
  success: lightColorTokens['status-success-icon'],
  successSoft: lightColorTokens['status-success-surface'],
  warning: lightColorTokens['status-warning-icon'],
  warningSoft: lightColorTokens['status-warning-surface'],
  info: lightColorTokens['status-info-icon'],
  infoSoft: lightColorTokens['status-info-surface'],
  health: lightColorTokens['person-4'],
  navigation: lightColorTokens['surface-secondary'],
};
