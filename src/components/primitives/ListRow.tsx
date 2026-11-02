import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { shadows } from '../../design/tokens/shadows';
import { sizes } from '../../design/tokens/sizes';
import { AppText } from './AppText';

type ListRowProps = {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  danger?: boolean;
  disabled?: boolean;
  trailing?: React.ReactNode;
  onPress?: () => void;
};

// Design System 3.2 list row. Dividers between rows come from ListGroup.
export function ListRow({ icon, title, subtitle, danger, disabled, trailing, onPress }: ListRowProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={[styles.row, { opacity: disabled ? 0.55 : 1 }]}
    >
      {icon ? (
        <View style={[styles.well, { backgroundColor: theme.colors.surface.brandTint }]}>{icon}</View>
      ) : null}
      <View style={styles.copy}>
        <AppText
          variant="label"
          style={danger ? { color: theme.colors.status.danger.text } : undefined}
          numberOfLines={2}
        >
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="secondary" numberOfLines={3}>{subtitle}</AppText>
        ) : null}
      </View>
      {trailing ??
        (onPress ? (
          <ChevronRight size={sizes.icon.sm} color={theme.colors.icon.secondary} strokeWidth={2} />
        ) : null)}
    </Pressable>
  );
}

// Design System 3.3 list group: one surface, dividers only, no row borders.
export function ListGroup({ children }: React.PropsWithChildren) {
  const { theme } = useAppTheme();
  const rows = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={[styles.group, shadows.card, { backgroundColor: theme.colors.surface.default }]}>
      {rows.map((row, index) => (
        <React.Fragment key={index}>
          {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.colors.border.subtle }]} /> : null}
          {row}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { borderRadius: radius.surface, overflow: 'hidden' },
  row: {
    minHeight: sizes.listRow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  well: {
    width: sizes.tileIcon,
    height: sizes.tileIcon,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
  divider: { height: StyleSheet.hairlineWidth },
});
