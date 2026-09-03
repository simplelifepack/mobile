import styled from 'styled-components/native';
import type { SpacingToken } from '../../design/tokens/spacing';
export const Stack = styled.View<{
  gap?: SpacingToken;
  align?: 'stretch' | 'center' | 'flex-start' | 'flex-end';
}>(({ theme, gap = 'md', align = 'stretch' }) => ({
  flexDirection: 'column',
  gap: theme.spacing[gap],
  alignItems: align,
}));
