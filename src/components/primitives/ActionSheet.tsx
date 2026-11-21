import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Check, type LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../../design/theme/ThemeProvider';
import { AppText } from './AppText';
import { fontSize, lineHeight, fontWeights} from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';

export type ActionSheetOption = {
  label: string;
  icon?: LucideIcon;
  // When defined the option is part of a single-choice list: only the chosen row shows a check.
  selected?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function ActionSheet({
  visible,
  title,
  options,
  onClose,
  onDismiss,
  embedded = false,
}: {
  visible: boolean;
  title: string;
  options: ActionSheetOption[];
  onClose: () => void;
  onDismiss?: () => void;
  embedded?: boolean;
}) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  const content = (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Close ${title} sheet`}
        style={[styles.backdrop, { backgroundColor: theme.colors.overlay.scrim }]}
        onPress={onClose}
      />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.colors.surface.default,
            borderColor: theme.colors.border.default,
            paddingBottom: Math.max(theme.spacing.md, insets.bottom + 8),
          },
        ]}
      >
        <View
          style={[styles.handle, { backgroundColor: theme.colors.border.default }]}
        />
        <View style={styles.header}>
          <AppText variant="listTitle">{title}</AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Done"
            hitSlop={12}
            onPress={onClose}
          >
            <AppText variant="label" style={{ color: theme.colors.text.interactive }}>
              Done
            </AppText>
          </Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled">
          {options.map(({ label, icon: Icon, selected, onPress, accessibilityLabel }, index) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityState={selected === undefined ? undefined : { selected }}
              accessibilityLabel={accessibilityLabel ?? label}
              onPress={onPress}
              style={({ pressed }) => [
                styles.option,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border.subtle },
                pressed && styles.pressed,
              ]}
            >
              {Icon ? (
                <Icon
                  size={theme.sizes.icon.md}
                  color={theme.colors.icon.secondary}
                  strokeWidth={2}
                />
              ) : null}
              <AppText style={styles.optionText}>{label}</AppText>
              {selected ? (
                <Check
                  size={theme.sizes.icon.md}
                  color={theme.colors.selection.icon}
                  strokeWidth={2.5}
                />
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </>
  );

  if (embedded) {
    if (!visible) return null;
    return (
      <View
        style={[
          styles.root,
          styles.embeddedRoot,
          { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right },
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
      onDismiss={onDismiss}
    >
      <View style={[styles.root, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
        {content}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  embeddedRoot: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    elevation: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    maxHeight: '100%',
    borderTopLeftRadius: radius.overlay,
    borderTopRightRadius: radius.overlay,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  option: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  optionText: { flex: 1, fontSize: fontSize.bodySm, lineHeight: lineHeight.bodySm, fontWeight: fontWeights.medium },
  pressed: { opacity: 0.7 },
});
