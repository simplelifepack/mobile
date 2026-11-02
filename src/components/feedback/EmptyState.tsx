import React from 'react';
import { AppText } from '../primitives/AppText';
import { Stack } from '../primitives/Stack';
export function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Stack align="center">
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      <AppText color="muted" align="center">
        {message}
      </AppText>
    </Stack>
  );
}
