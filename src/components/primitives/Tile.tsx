import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { shadows } from '../../design/tokens/shadows';
import { sizes } from '../../design/tokens/sizes';
import { AppText } from './AppText';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info';

type Props = {
  icon: LucideIcon;
  title: string;
  status: string;
  statusTone?: StatusTone | 'neutral';
  onPress: () => void;
};

// Design System 3.1 module tile: icon well, one-line title, one-line status.
export function Tile({ icon: Icon, title, status, statusTone = 'neutral', onPress }: Props) {
  const { theme } = useAppTheme();
  const statusColor =
    statusTone === 'neutral' ? theme.colors.text.secondary : theme.colors.status[statusTone].text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${status}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        shadows.card,
        {
          backgroundColor: theme.colors.surface.default,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <View style={[styles.well, { backgroundColor: theme.colors.surface.brandTint }]}>
        <Icon size={sizes.icon.md} color={theme.colors.icon.interactive} strokeWidth={2} />
      </View>
      <View>
        <AppText variant="labelMd" color="heading" numberOfLines={1}>{title}</AppText>
        <AppText variant="bodySm" style={{ color: statusColor }} numberOfLines={1}>{status}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 112,
    padding: 16,
    borderRadius: radius.tile,
    justifyContent: 'space-between',
  },
  well: {
    width: sizes.tileIcon,
    height: sizes.tileIcon,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
