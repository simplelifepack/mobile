import React from 'react';
import { ActivityIndicator } from 'react-native';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { AppText } from '../primitives/AppText';
import { Stack } from '../primitives/Stack';
export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  const { theme } = useAppTheme();
  return (
    <Stack align="center">
      <ActivityIndicator color={theme.colors.primary} />
      <AppText color="muted">{label}</AppText>
    </Stack>
  );
}
