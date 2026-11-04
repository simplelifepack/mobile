import React from 'react';
import type { TextProps } from 'react-native';
import styled from 'styled-components/native';
import type { TypographyVariant } from '../../design/tokens/typography';
type TextColor =
  | 'disabled'
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'warning'
  | 'danger'
  | 'success'
  | 'onPrimary'
  | 'accent';
type Props = TextProps & {
  variant?: TypographyVariant;
  color?: TextColor;
  align?: 'left' | 'center' | 'right';
};
const StyledText = styled.Text<{
  variant: TypographyVariant;
  colorName: TextColor;
  align: NonNullable<Props['align']>;
}>(({ theme, variant, colorName, align }) => ({
  ...theme.typography[variant],
  lineHeight: `${theme.typography[variant].lineHeight}px`,
  color: {
    primary: theme.colors.textPrimary,
    accent: theme.colors.textInteractive,
    disabled: theme.colors.textDisabled,
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted,
    danger: theme.colors.danger,
    warning: theme.colors.warning,
    success: theme.colors.success,
    onPrimary: theme.colors.onPrimary,
  }[colorName],
  textAlign: align,
  flexShrink: 1,
}));
export function AppText({
  variant = 'body',
  color = 'primary',
  align = 'left',
  ...props
}: Props) {
  return (
    <StyledText variant={variant} colorName={color} align={align} {...props} />
  );
}
