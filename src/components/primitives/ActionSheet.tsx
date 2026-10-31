import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../../design/theme/ThemeProvider';
import { AppText } from './AppText';

export type ActionSheetOption = {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function ActionSheet({
  visible,
  title,
  options,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: ActionSheetOption[];
  onClose: () => void;
}) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Close ${title} sheet`}
          style={styles.backdrop}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              paddingBottom: Math.max(theme.spacing.md, insets.bottom + 8),
            },
          ]}
        >
          <View
            style={[styles.handle, { backgroundColor: theme.colors.border }]}
          />
          <View style={styles.header}>
            <AppText variant="heading">{title}</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Done"
              hitSlop={12}
              onPress={onClose}
            >
              <AppText variant="label" style={{ color: theme.colors.primary }}>
                Done
              </AppText>
            </Pressable>
          </View>
          {options.map(({ label, icon: Icon, onPress, accessibilityLabel }) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel ?? label}
              onPress={onPress}
              style={({ pressed }) => [
                styles.option,
                pressed && styles.pressed,
              ]}
            >
              <Icon
                size={20}
                color={theme.colors.textSecondary}
                strokeWidth={2}
              />
              <AppText style={styles.optionText}>{label}</AppText>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  optionText: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
  pressed: { opacity: 0.7 },
});
