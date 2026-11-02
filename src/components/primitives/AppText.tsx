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
const headingVariants: TypographyVariant[] = ['display', 'title', 'heading'];

const StyledText = styled.Text<{
  variant: TypographyVariant;
  colorName: TextColor;
  align: NonNullable<Props['align']>;
}>(({ theme, variant, colorName, align }) => ({
  ...theme.typography[variant],
  color: {
    primary: headingVariants.includes(variant)
      ? theme.colors.text.heading
      : theme.colors.text.primary,
    secondary: theme.colors.text.secondary,
    muted: theme.colors.text.tertiary,
    danger: theme.colors.status.danger.text,
    success: theme.colors.status.success.text,
    onPrimary: theme.colors.text.onBrand,
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
