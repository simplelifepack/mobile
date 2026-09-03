import React from 'react';
import type { PressableProps } from 'react-native';
import styled from 'styled-components/native';
import { AppText } from './AppText';
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const Pressable = styled.Pressable<{ variant: Variant; disabled?: boolean }>(
  ({ theme, variant, disabled }) => ({
    height: theme.sizes.button.md,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
    backgroundColor:
      variant === 'primary'
        ? theme.colors.primary
        : variant === 'danger'
          ? theme.colors.danger
          : variant === 'secondary'
            ? theme.colors.surfaceElevated
            : 'transparent',
    borderWidth: variant === 'secondary' ? 1 : 0,
    borderColor: theme.colors.border,
  }),
);
export function Button({
  title,
  variant = 'primary',
  ...props
}: PressableProps & { title: string; variant?: Variant }) {
  const textColor =
    variant === 'primary' || variant === 'danger' ? 'onPrimary' : 'secondary';
  return (
    <Pressable accessibilityRole="button" variant={variant} {...props}>
      <AppText variant="label" color={textColor}>
        {title}
      </AppText>
    </Pressable>
  );
}
