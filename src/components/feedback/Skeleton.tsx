import styled from 'styled-components/native';
export const Skeleton = styled.View<{ height?: number; $short?: boolean }>(
  ({ theme, height = theme.sizes.input, $short }) => ({
    height,
    width: $short ? '45%' : '78%',
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.border,
    opacity: 0.65,
  }),
);
