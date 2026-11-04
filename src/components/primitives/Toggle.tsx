import styled from 'styled-components/native';
export const Toggle = styled.Switch.attrs(({ theme }) => ({
  trackColor: { false: theme.colors.border, true: theme.colors.primary },
  thumbColor: theme.colors.surface,
  ios_backgroundColor: theme.colors.border,
}))``;
