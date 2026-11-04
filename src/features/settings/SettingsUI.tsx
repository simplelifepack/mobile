import React from 'react';
import { Pressable, View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import styled from 'styled-components/native';
import { AppText } from '../../components/primitives/AppText';
import { Stack } from '../../components/primitives/Stack';
import { useAppTheme } from '../../design/theme/ThemeProvider';
const Panel = styled.View(({ theme }) => ({
  borderRadius: theme.radius.panel,
  borderWidth: 1,
  borderColor: theme.colors.border,
  backgroundColor: theme.colors.surface,
  overflow: 'hidden',
}));
const Item = styled.Pressable<{ $disabled?: boolean }>(
  ({ theme, $disabled }) => ({
    padding: theme.spacing.md,
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm + theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    opacity: $disabled ? 0.5 : 1,
  }),
);
const Badge = styled.View(({ theme }) => ({
  width: 34,
  height: 34,
  borderRadius: theme.radius.md,
  backgroundColor: theme.colors.primarySoft,
  alignItems: 'center',
  justifyContent: 'center',
}));
const Copy = styled.View(({ theme }) => ({ flex: 1, gap: theme.spacing.xs }));
const Content = styled.View(({ theme }) => ({
  padding: theme.spacing.md,
  gap: theme.spacing.sm,
}));
export const AccountAvatar = styled.View(({ theme }) => ({
  width: 48,
  height: 48,
  borderRadius: theme.radius.pill,
  backgroundColor: theme.colors.primarySoft,
  alignItems: 'center',
  justifyContent: 'center',
}));
export const AccountSummary = styled.View(({ theme }) => ({
  padding: theme.spacing.md,
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: theme.colors.border,
}));
export const AccountCopy = Copy;
export const SettingsContent = Content;
export function SettingsSection({
  title,
  children,
}: React.PropsWithChildren<{ title: string }>) {
  return (
    <Stack gap="sm">
      <AppText variant="label" color="muted">
        {title}
      </AppText>
      <Panel>{children}</Panel>
    </Stack>
  );
}
export function SettingsRow({
  label,
  description,
  value,
  Icon,
  onPress,
  disabled,
  danger,
  trailing,
}: {
  label: string;
  description?: string;
  value?: string;
  Icon?: LucideIcon;
  onPress?: () => void;
  disabled?: boolean;
  danger?: boolean;
  trailing?: React.ReactNode;
}) {
  const { theme } = useAppTheme();
  return (
    <Item
      as={onPress ? Pressable : View}
      $disabled={disabled}
      accessible={!trailing}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { disabled: Boolean(disabled) } : undefined}
    >
      {Icon ? (
        <Badge>
          <Icon
            size={19}
            color={danger ? theme.colors.danger : theme.colors.primary}
          />
        </Badge>
      ) : null}
      <Copy>
        <AppText variant="label" color={danger ? 'danger' : 'primary'}>
          {label}
        </AppText>
        {description ? (
          <AppText variant="caption" color="muted">
            {description}
          </AppText>
        ) : null}
      </Copy>
      {trailing ??
        (value ? (
          <AppText variant="caption" color="muted">
            {value}
          </AppText>
        ) : null)}
      {onPress ? (
        <ChevronRight size={18} color={theme.colors.textMuted} />
      ) : null}
    </Item>
  );
}
