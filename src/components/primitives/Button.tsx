import React from 'react';
import type { PressableProps } from 'react-native';
import styled from 'styled-components/native';
import {
  lightColorTokens,
  darkColorTokens,
} from '../../design/tokens/colorTokens';
import { AppText } from './AppText';
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const Pressable = styled.Pressable<{
  variant: Variant;
  disabled?: boolean;
  $pressed: boolean;
}>(({ theme, variant, disabled, $pressed }) => {
  const tokens = theme.isDark ? darkColorTokens : lightColorTokens;
  const action =
    variant === 'danger'
      ? 'destructive'
      : variant === 'primary'
        ? 'primary'
        : variant === 'secondary'
          ? 'secondary'
          : 'tertiary';
  const state = disabled ? 'disabled' : $pressed ? 'pressed' : 'default';
  return {
    minHeight: theme.sizes.minimumTouchTarget,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 1,
    backgroundColor: tokens[`action-${action}-${state}`],
    borderWidth: variant === 'secondary' ? 1 : 0,
    borderColor: theme.colors.border,
  };
});
export function Button({
  title,
  variant = 'primary',
  ...props
}: PressableProps & { title: string; variant?: Variant }) {
  const [pressed, setPressed] = React.useState(false);
  const textColor = props.disabled
    ? 'disabled'
    : variant === 'primary' || variant === 'danger'
      ? 'onPrimary'
      : variant === 'ghost'
        ? 'accent'
        : 'secondary';
  return (
    <Pressable
      accessibilityRole="button"
      variant={variant}
      {...props}
      $pressed={pressed}
      onPressIn={event => {
        setPressed(true);
        props.onPressIn?.(event);
      }}
      onPressOut={event => {
        setPressed(false);
        props.onPressOut?.(event);
      }}
    >
      <AppText variant="action" color={textColor}>
        {title}
      </AppText>
    </Pressable>
  );
}
