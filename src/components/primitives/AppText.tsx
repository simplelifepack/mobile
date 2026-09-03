import React from 'react';
import type { TextProps } from 'react-native';
import styled from 'styled-components/native';
import type { TypographyVariant } from '../../design/tokens/typography';
type TextColor =
  'primary' | 'secondary' | 'muted' | 'danger' | 'success' | 'onPrimary';
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
  color: {
    primary: theme.colors.textPrimary,
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted,
    danger: theme.colors.danger,
    success: theme.colors.success,
    onPrimary: theme.colors.onPrimary,
  }[colorName],
  textAlign: align,
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
