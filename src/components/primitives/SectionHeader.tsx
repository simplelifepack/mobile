import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '../../design/theme/ThemeProvider';
import { sizes } from '../../design/tokens/sizes';
import { AppText } from './AppText';

type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

// Design System 2.4: a short title with an optional text link acting on the whole section.
export function SectionHeader({ title, actionLabel, onAction }: Props) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.row}>
      <AppText variant="eyebrow" accessibilityRole="header">{title}</AppText>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.action}>
          <AppText variant="label" style={{ color: theme.colors.text.link }}>{actionLabel}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  action: { minHeight: sizes.minimumTouchTarget, justifyContent: 'center' },
});
