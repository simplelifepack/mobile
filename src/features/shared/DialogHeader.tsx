import React from 'react';
import { X } from 'lucide-react-native';
import styled from 'styled-components/native';
import { AppText } from '../../components/primitives/AppText';
import { useAppTheme } from '../../design/theme/ThemeProvider';
const Header = styled.View(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.sm,
  paddingVertical: theme.spacing.md,
  paddingHorizontal: theme.spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: theme.colors.border,
}));
const Heading = styled(AppText)(() => ({ flex: 1 }));
const Close = styled.Pressable(({ theme }) => ({
  width: theme.sizes.minimumTouchTarget,
  height: theme.sizes.minimumTouchTarget,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.radius.pill,
  backgroundColor: theme.colors.surfaceElevated,
}));
export function DialogHeader({
  title,
  onClose,
  disabled = false,
}: {
  title: string;
  onClose: () => void;
  disabled?: boolean;
}) {
  const { theme } = useAppTheme();
  return (
    <Header>
      <Heading variant="heading">{title}</Heading>
      <Close
        accessibilityRole="button"
        accessibilityLabel={`Close ${title}`}
        onPress={onClose}
        disabled={disabled}
      >
        <X size={20} color={theme.colors.textMuted} />
      </Close>
    </Header>
  );
}
