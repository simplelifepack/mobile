import styled from 'styled-components/native';
import { shadows } from '../../design/tokens/shadows';
export const Card = styled.View(({ theme }) => ({
  backgroundColor: theme.colors.surface.default,
  borderRadius: theme.radius.surface,
  borderWidth: 1,
  borderColor: theme.colors.border.subtle,
  padding: theme.spacing.md,
  ...shadows.card,
}));
