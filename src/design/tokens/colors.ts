import {
  lightColorTokens as light,
  darkColorTokens as dark,
} from './colorTokens';

// Compatibility aliases for native consumers.
export const palette = {
  white: light['surface-default'],
  black: light['text-heading'],
  gray50: light['surface-canvas'],
  gray100: light['border-default'],
  gray300: dark['text-primary'],
  gray500: light['text-tertiary'],
  gray700: light['text-primary'],
  gray900: light['text-heading'],
  actionDark: dark['action-primary-default'],
  actionLight: light['action-primary-default'],
  actionHover: light['action-primary-hover'],
  green500: light['status-success-icon'],
  amber500: light['status-warning-icon'],
  red500: light['status-danger-icon'],
  navy950: dark['surface-canvas'],
  navy900: dark['surface-default'],
  navy800: dark['surface-secondary'],
} as const;
