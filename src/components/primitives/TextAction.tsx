import React from 'react';
import type { PressableProps } from 'react-native';
import styled from 'styled-components/native';
import { AppText } from './AppText';
const Target = styled.Pressable(({ theme }) => ({
  minHeight: theme.sizes.minimumTouchTarget,
  paddingHorizontal: theme.spacing.xs,
  justifyContent: 'center',
  alignItems: 'center',
}));
export function TextAction({
  title,
  ...props
}: PressableProps & { title: string }) {
  return (
    <Target accessibilityRole="button" {...props}>
      <AppText variant="action" color="accent">
        {title}
      </AppText>
    </Target>
  );
}
