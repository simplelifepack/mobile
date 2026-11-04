import React from 'react';
import styled from 'styled-components/native';
import { Stack } from '../../components/primitives/Stack';

const PlaceholderRow = styled.View(({ theme }) => ({
  minHeight: 76,
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.sm,
  padding: theme.spacing.sm + theme.spacing.xs,
  backgroundColor: theme.colors.surface,
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: theme.radius.lg,
}));
const IconPlaceholder = styled.View(({ theme }) => ({
  width: 38,
  height: 38,
  borderRadius: theme.radius.pill,
  backgroundColor: theme.colors.border,
}));
const Copy = styled.View(({ theme }) => ({ flex: 1, gap: theme.spacing.sm }));
const TitlePlaceholder = styled.View(({ theme }) => ({
  width: '70%',
  height: 14,
  borderRadius: theme.radius.sm,
  backgroundColor: theme.colors.border,
}));
const DetailPlaceholder = styled.View(({ theme }) => ({
  width: '42%',
  height: 10,
  borderRadius: theme.radius.sm,
  backgroundColor: theme.colors.border,
}));

export function PackageListSkeleton() {
  return (
    <Stack
      gap="sm"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading packages"
      accessibilityState={{ busy: true }}
    >
      {[0, 1, 2, 3].map(index => (
        <PlaceholderRow
          key={index}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <IconPlaceholder />
          <Copy>
            <TitlePlaceholder />
            <DetailPlaceholder />
          </Copy>
        </PlaceholderRow>
      ))}
    </Stack>
  );
}
