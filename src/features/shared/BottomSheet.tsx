import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import styled from 'styled-components/native';
import { AppModal } from '../../components/primitives/AppModal';
import { AppText } from '../../components/primitives/AppText';
import { useAppTheme } from '../../design/theme/ThemeProvider';
const Root = styled(KeyboardAvoidingView)(() => ({
  flex: 1,
  justifyContent: 'flex-end',
}));
const Backdrop = styled.Pressable(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: theme.colors.overlay,
}));
const Panel = styled.View<{ $bottom: number }>(({ theme, $bottom }) => ({
  maxHeight: '88%',
  backgroundColor: theme.colors.surface,
  borderTopLeftRadius: theme.radius.panel,
  borderTopRightRadius: theme.radius.panel,
  paddingBottom: Math.max($bottom, theme.spacing.md),
  overflow: 'hidden',
}));
const Handle = styled.View(({ theme }) => ({
  width: 34,
  height: 4,
  borderRadius: theme.radius.pill,
  backgroundColor: theme.colors.border,
  alignSelf: 'center',
  marginTop: theme.spacing.sm,
}));
const Header = styled.View(({ theme }) => ({
  paddingHorizontal: theme.spacing.md,
  paddingTop: theme.spacing.sm,
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.sm,
}));
const Copy = styled.View(() => ({ flex: 1 }));
const Close = styled.Pressable(({ theme }) => ({
  minWidth: theme.sizes.minimumTouchTarget,
  minHeight: theme.sizes.minimumTouchTarget,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.radius.md,
}));
const Content = styled.ScrollView.attrs({
  keyboardShouldPersistTaps: 'handled' as const,
  automaticallyAdjustKeyboardInsets: false,
})(() => ({ flexGrow: 0 }));
const Body = styled.View(({ theme }) => ({
  paddingHorizontal: theme.spacing.md,
  paddingTop: theme.spacing.sm,
  gap: theme.spacing.md,
}));
export function BottomSheet({
  title,
  subtitle,
  onClose,
  children,
  done = false,
  busy = false,
  visible = true,
  onDismiss,
}: React.PropsWithChildren<{
  title: string;
  subtitle?: string;
  onClose: () => void;
  done?: boolean;
  busy?: boolean;
  visible?: boolean;
  onDismiss?: () => void;
}>) {
  const { bottom } = useSafeAreaInsets();
  const { theme } = useAppTheme();
  return (
    <AppModal
      visible={visible}
      onDismiss={onDismiss}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <Root behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Backdrop
          accessibilityRole="button"
          accessibilityLabel={`Dismiss ${title}`}
          onPress={() => {
            if (!busy) onClose();
          }}
        />
        <Panel $bottom={bottom} accessibilityViewIsModal>
          <Handle />
          <Header>
            <Copy>
              <AppText variant="heading">{title}</AppText>
              {subtitle ? (
                <AppText variant="caption" color="muted">
                  {subtitle}
                </AppText>
              ) : null}
            </Copy>
            <Close
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={`Close ${title}`}
              onPress={onClose}
            >
              {done ? (
                <AppText variant="label" color="accent">
                  Done
                </AppText>
              ) : (
                <X size={19} color={theme.colors.textMuted} />
              )}
            </Close>
          </Header>
          <Content>
            <Body>{children}</Body>
          </Content>
        </Panel>
      </Root>
    </AppModal>
  );
}
