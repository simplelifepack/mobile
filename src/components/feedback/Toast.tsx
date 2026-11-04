import React from 'react';
import styled from 'styled-components/native';
import { AppText } from '../primitives/AppText';
const Box = styled.View(({ theme }) => ({
  position: 'absolute',
  left: theme.spacing.md,
  right: theme.spacing.md,
  bottom: theme.spacing.xl,
  padding: theme.spacing.md,
  borderRadius: theme.radius.md,
  backgroundColor: theme.colors.surfaceElevated,
  ...theme.shadows.floating,
}));
export function Toast({ message }: { message: string }) {
  return (
    <Box accessibilityRole="alert">
      <AppText>{message}</AppText>
    </Box>
  );
}
