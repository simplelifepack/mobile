import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Check, ChevronRight } from 'lucide-react-native';

import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { shadows } from '../../design/tokens/shadows';
import { sizes } from '../../design/tokens/sizes';
import { AppText } from './AppText';

type ListRowProps = {
  icon?: React.ReactNode;
  // Replaces the icon well, e.g. a readiness ring.
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  // Third line reserved for an exception, e.g. "No nominee named".
  extra?: string;
  danger?: boolean;
  disabled?: boolean;
  trailing?: React.ReactNode;
  selected?: boolean;
  // Detail content revealed under the row (e.g. an expanded document).
  children?: React.ReactNode;
  onPress?: () => void;
};

// Design System 3.2 list row. Dividers between rows come from ListGroup.
export function ListRow({ icon, leading, title, subtitle, extra, danger, disabled, trailing, selected, children, onPress }: ListRowProps) {
  const { theme } = useAppTheme();

  return (
    <View style={selected ? { backgroundColor: theme.colors.selection.surface } : undefined}>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityState={selected === undefined ? undefined : { selected }}
        disabled={disabled || !onPress}
        onPress={onPress}
        style={({ pressed }) => [styles.row, { opacity: disabled ? 0.55 : pressed ? 0.82 : 1 }]}
      >
        {leading ?? (icon ? (
          <View style={[styles.well, { backgroundColor: theme.colors.surface.brandTint }]}>{icon}</View>
        ) : null)}
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
          {extra ? (
            <AppText variant="caption" style={{ color: theme.colors.status.danger.text }} numberOfLines={2}>{extra}</AppText>
          ) : null}
        </View>
        {trailing ??
          (onPress ? (
            <ChevronRight size={sizes.icon.sm} color={theme.colors.icon.secondary} strokeWidth={2} />
          ) : null)}
      </Pressable>
      {children ? <View style={styles.details}>{children}</View> : null}
    </View>
  );
}

// Leading/trailing checkbox for selection mode.
export function SelectionMark({ checked }: { checked: boolean }) {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        styles.mark,
        {
          borderColor: checked ? theme.colors.border.interactive : theme.colors.border.default,
          backgroundColor: checked ? theme.colors.action.primary.default : 'transparent',
        },
      ]}
    >
      {checked ? <Check size={sizes.icon.sm} color={theme.colors.text.onBrand} strokeWidth={3} /> : null}
    </View>
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
  details: { paddingHorizontal: 16, paddingBottom: 12, gap: 4 },
  mark: {
    width: 24,
    height: 24,
    borderRadius: radius.control,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth },
});
