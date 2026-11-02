import styled from 'styled-components/native';
export const Skeleton = styled.View<{ height?: number }>(
  ({ theme, height = theme.sizes.input }) => ({
    height,
    borderRadius: theme.radius.control,
    backgroundColor: theme.colors.surface.raised,
  }),
);
