import styled from 'styled-components/native';
export const Card = styled.View(({ theme }) => ({
  backgroundColor: theme.colors.surface,
  borderRadius: theme.radius.panel,
  borderWidth: 1,
  borderColor: theme.colors.border,
  padding: theme.spacing.md,
}));
