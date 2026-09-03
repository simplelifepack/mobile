import React from 'react';
import styled from 'styled-components/native';
import { AppText } from '../primitives/AppText';
type Status = 'success' | 'warning' | 'danger';
const Box = styled.View<{ status: Status }>(({ theme, status }) => ({
  alignSelf: 'flex-start',
  borderRadius: theme.radius.pill,
  paddingHorizontal: theme.spacing.sm,
  paddingVertical: theme.spacing.xs,
  borderWidth: 1,
  borderColor: theme.colors[status],
}));
export function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: Status;
}) {
  return (
    <Box status={status}>
      <AppText
        variant="caption"
        color={status === 'warning' ? 'secondary' : status}
      >
        {label}
      </AppText>
    </Box>
  );
}
