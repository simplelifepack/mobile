import styled from 'styled-components/native';
import type { SpacingToken } from '../../design/tokens/spacing';
export const Row = styled.View<{
  gap?: SpacingToken;
  align?: 'stretch' | 'center' | 'flex-start' | 'flex-end';
  justify?: 'flex-start' | 'center' | 'space-between' | 'flex-end';
}>(({ theme, gap = 'md', align = 'stretch', justify = 'flex-start' }) => ({
  flexDirection: 'row',
  gap: theme.spacing[gap],
  alignItems: align,
  justifyContent: justify,
}));
