import React from 'react';
import type { LucideIcon } from 'lucide-react-native';
import styled from 'styled-components/native';
import { useAppTheme } from '../../design/theme/ThemeProvider';
const Touch = styled.Pressable(({ theme }) => ({
  width: theme.sizes.minimumTouchTarget,
  height: theme.sizes.minimumTouchTarget,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.radius.pill,
}));
export function IconButton({
  icon: Icon,
  label,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Touch
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
    >
      <Icon size={theme.sizes.icon.md} color={theme.colors.textPrimary} />
    </Touch>
  );
}
