import React from 'react';
import styled from 'styled-components/native';
import { AppText } from '../primitives/AppText';
import { shadows } from '../../design/tokens/shadows';
const Box = styled.View(({ theme }) => ({
  position: 'absolute',
  left: theme.spacing.md,
  right: theme.spacing.md,
  bottom: theme.spacing.xl,
  padding: theme.spacing.md,
  borderRadius: theme.radius.control,
  backgroundColor: theme.colors.surface.raised,
  ...shadows.floating,
}));
export function Toast({ message }: { message: string }) {
  return (
    <Box accessibilityRole="alert">
      <AppText>{message}</AppText>
    </Box>
  );
}
