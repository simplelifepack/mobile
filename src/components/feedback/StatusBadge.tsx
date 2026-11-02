import React from 'react';
import styled from 'styled-components/native';
type Status = 'success' | 'warning' | 'danger' | 'info';
const Box = styled.View<{ status: Status }>(({ theme, status }) => ({
  alignSelf: 'flex-start',
  borderRadius: theme.radius.pill,
  paddingHorizontal: theme.spacing.sm,
  paddingVertical: theme.spacing.xs,
  borderWidth: 1,
  borderColor: theme.colors.status[status].border,
  backgroundColor: theme.colors.status[status].surface,
}));
const Label = styled.Text<{ status: Status }>(({ theme, status }) => ({
  ...theme.typography.caption,
  color: theme.colors.status[status].text,
}));
// Status is always conveyed with a word, never colour alone.
export function StatusBadge({ label, status }: { label: string; status: Status }) {
  return (
    <Box status={status}>
      <Label status={status}>{label}</Label>
    </Box>
  );
}
