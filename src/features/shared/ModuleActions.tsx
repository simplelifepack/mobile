import { BottomSheet } from './BottomSheet';
import { useFocusEffect } from '@react-navigation/native';
import React from 'react';
import { Keyboard, Platform } from 'react-native';
import { Plus, ChevronRight, type LucideIcon } from 'lucide-react-native';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { AppText } from '../../components/primitives/AppText';
export type ModuleAction = {
  label: string;
  Icon?: LucideIcon;
  description?: string;
  disabled?: boolean;
  onPress: () => void;
};
const Trigger = styled.Pressable<{ $bottom: number }>(({ theme, $bottom }) => ({
  position: 'absolute',
  right: theme.spacing.md,
  bottom: $bottom,
  width: theme.sizes.button.lg,
  height: theme.sizes.button.lg,
  borderRadius: theme.radius.pill,
  backgroundColor: theme.colors.primary,
  justifyContent: 'center',
  alignItems: 'center',
  ...theme.shadows.floating,
}));
const Item = styled.Pressable<{ $disabled?: boolean; $divided?: boolean }>(
  ({ theme, $disabled, $divided }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: theme.sizes.button.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: $divided ? 1 : 0,
    borderBottomColor: theme.colors.border,
    opacity: $disabled ? 0.45 : 1,
  }),
);
const Copy = styled.View(() => ({ flex: 1 }));
const Footer = styled.View(({ theme }) => ({ padding: theme.spacing.md }));
const Options = styled.ScrollView.attrs({
  keyboardShouldPersistTaps: 'handled' as const,
})(() => ({ flexGrow: 0 }));
export function ModuleActions({
  title,
  actions,
  footer,
  sheetTitle,
  subtitle,
  onTrigger,
}: {
  title: string;
  sheetTitle?: string;
  subtitle?: string;
  onTrigger?: () => void;
  actions: ModuleAction[];
  footer?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const pending = React.useRef<(() => void) | null>(null);
  const finish = () => {
    const next = pending.current;
    pending.current = null;
    next?.();
  };
  useFocusEffect(
    React.useCallback(
      () => () => {
        pending.current = null;
        setOpen(false);
      },
      [],
    ),
  );
  const { bottom } = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const offset =
    Math.max(bottom, theme.spacing.sm) + theme.sizes.tabBar + theme.spacing.md;
  if (!actions.length && !onTrigger) return null;
  return (
    <>
      <Trigger
        $bottom={offset}
        accessibilityRole="button"
        accessibilityLabel={`${title} actions`}
        accessibilityState={{ expanded: open }}
        onPress={() => {
          Keyboard.dismiss();
          if (onTrigger) onTrigger();
          else setOpen(true);
        }}
      >
        <Plus size={27} color={theme.colors.onPrimary} />
      </Trigger>
      <BottomSheet
        visible={open}
        onDismiss={finish}
        title={sheetTitle || `Add to ${title}`}
        subtitle={subtitle}
        done
        onClose={() => setOpen(false)}
      >
        <Options>
          {actions.map(action => (
            <Item
              key={action.label}
              accessibilityRole="button"
              accessibilityState={{ disabled: Boolean(action.disabled) }}
              disabled={action.disabled}
              $disabled={action.disabled}
              $divided={Boolean(action.description)}
              onPress={() => {
                pending.current = action.onPress;
                setOpen(false);
                if (Platform.OS !== 'ios') finish();
              }}
            >
              {action.Icon ? (
                <action.Icon size={19} color={theme.colors.primary} />
              ) : null}
              <Copy>
                <AppText>{action.label}</AppText>
                {action.description ? (
                  <AppText variant="caption" color="muted">
                    {action.description}
                  </AppText>
                ) : null}
              </Copy>
              {action.description ? (
                <ChevronRight size={16} color={theme.colors.textMuted} />
              ) : null}
            </Item>
          ))}
          {footer ? <Footer>{footer}</Footer> : null}
        </Options>
      </BottomSheet>
    </>
  );
}
