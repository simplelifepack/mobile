import styled from 'styled-components/native';
import { staticColors } from '../../design/tokens/colors';
export const Card = styled.View(({ theme }) => ({
  backgroundColor: theme.colors.surface.default,
  borderRadius: theme.radius.surface,
  borderWidth: 1,
  borderColor: theme.colors.border.default,
  padding: theme.spacing.md,
  shadowColor: staticColors.shadow,
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
}));
