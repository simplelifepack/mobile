import React from 'react';
import { ActivityIndicator } from 'react-native';
import { Skeleton } from './Skeleton';
import { Card } from '../primitives/Card';
import { AppText } from '../primitives/AppText';
import { Stack } from '../primitives/Stack';
export function LoadingState({
  label = 'Loading…',
  compact = false,
  skeleton = true,
}: {
  label?: string;
  compact?: boolean;
  skeleton?: boolean;
}) {
  return (
    <Stack
      gap="sm"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
    >
      <AppText
        color="secondary"
        variant="caption"
        accessibilityLiveRegion="polite"
      >
        {label}
      </AppText>
      {!skeleton ? <ActivityIndicator /> : null}
      {Array.from({ length: !skeleton ? 0 : compact ? 1 : 4 }, (_, index) => (
        <Card
          key={index}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Stack gap="sm">
            <Skeleton height={16} />
            <Skeleton height={10} $short />
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
