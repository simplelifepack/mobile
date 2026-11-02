import React from 'react';
import styled from 'styled-components/native';
import { AppText } from './AppText';
const Container = styled.View(({ theme }) => ({
  alignSelf: 'flex-start',
  paddingHorizontal: theme.spacing.sm,
  paddingVertical: theme.spacing.xs,
  borderRadius: theme.radius.pill,
  backgroundColor: theme.colors.surface.raised,
}));
export function Badge({ label }: { label: string }) {
  return (
    <Container>
      <AppText variant="caption" color="secondary">
        {label}
      </AppText>
    </Container>
  );
}
