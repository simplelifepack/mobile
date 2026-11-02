import React from 'react';
import type { PressableProps } from 'react-native';
import styled from 'styled-components/native';
import { AppText } from './AppText';
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const Pressable = styled.Pressable<{ variant: Variant; disabled?: boolean }>(
  ({ theme, variant, disabled }) => {
    const { action, border } = theme.colors;
    return {
      height: theme.sizes.button.md,
      borderRadius: theme.radius.control,
      paddingHorizontal: theme.spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.5 : 1,
      backgroundColor: {
        primary: action.primary.default,
        danger: action.destructive.default,
        secondary: action.secondary.default,
        ghost: action.tertiary.default,
      }[variant],
      borderWidth: variant === 'secondary' ? 1 : 0,
      borderColor: border.default,
    };
  },
);
export function Button({
  title,
  variant = 'primary',
  ...props
}: PressableProps & { title: string; variant?: Variant }) {
  const textColor =
    variant === 'primary' || variant === 'danger' ? 'onPrimary' : 'primary';
  return (
    <Pressable accessibilityRole="button" variant={variant} {...props}>
      <AppText variant="label" color={textColor}>
        {title}
      </AppText>
    </Pressable>
  );
}
