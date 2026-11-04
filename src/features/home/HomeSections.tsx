import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowRight, ChevronRight, type LucideIcon } from 'lucide-react-native';

import { AppText } from '../../components/primitives/AppText';
import { Row } from '../../components/primitives/Row';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { shadows } from '../../design/tokens/shadows';
import { sizes } from '../../design/tokens/sizes';

export type AttentionItem = {
  id: string;
  Icon: LucideIcon;
  title: string;
  label: string;
  overdue: boolean;
  onPress: () => void;
};

const PREVIEW_COUNT = 3;

// "Needs attention" list: three rows by default, expandable to all.
export function AttentionPanel({
  items,
  emptyMessage,
  expanded,
  onToggle,
}: {
  items: AttentionItem[];
  emptyMessage: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;

  return (
    <View style={[styles.panel, shadows.card, { backgroundColor: colors.surface.default }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={styles.panelHeader}
      >
        <AppText variant="labelMd" color="heading" style={styles.flex}>Needs attention</AppText>
        <View style={[styles.count, { backgroundColor: colors.action.primary.default }]}>
          <AppText variant="caption" color="onPrimary">{items.length}</AppText>
        </View>
        <ChevronRight size={sizes.icon.md} color={colors.icon.secondary} />
      </Pressable>

      {items.slice(0, expanded ? undefined : PREVIEW_COUNT).map(({ id, Icon, title, label, overdue, onPress }) => (
        <Pressable
          key={id}
          accessibilityRole="button"
          onPress={onPress}
          style={[styles.taskRow, { borderTopColor: colors.border.subtle }]}
        >
          <View style={[styles.well, { backgroundColor: colors.surface.brandTint }]}>
            <Icon size={sizes.icon.md} color={colors.icon.interactive} />
          </View>
          <View style={styles.flex}>
            <AppText variant="labelMd" numberOfLines={1}>{title}</AppText>
            <AppText
              variant="caption"
              style={{ color: overdue ? colors.status.danger.text : colors.text.secondary }}
            >
              {label}
            </AppText>
          </View>
        </Pressable>
      ))}

      {!items.length ? (
        <View style={[styles.taskRow, { borderTopColor: colors.border.subtle }]}>
          <AppText variant="bodySm" color="secondary">{emptyMessage}</AppText>
        </View>
      ) : items.length > PREVIEW_COUNT ? (
        <Pressable
          accessibilityRole="button"
          onPress={onToggle}
          style={[styles.showAll, { borderTopColor: colors.border.subtle }]}
        >
          <AppText variant="labelMd" style={{ color: colors.text.interactive }}>
            {expanded ? 'Show less' : `Show all ${items.length}`}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

// Module metric: icon, count badge, big value, detail line and a progress bar or "View all".
export function MetricTile({
  label,
  value,
  detail,
  detailColor,
  badge,
  progress,
  Icon,
  onPress,
}: {
  label: string;
  value: string | number;
  detail: string;
  detailColor?: string;
  badge?: string | number;
  progress?: number;
  Icon: LucideIcon;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value}, ${detail}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        shadows.card,
        { backgroundColor: colors.surface.default, transform: [{ scale: pressed ? 0.985 : 1 }] },
      ]}
    >
      <Row align="center" justify="space-between">
        <View style={[styles.well, { backgroundColor: colors.surface.brandTint }]}>
          <Icon size={sizes.icon.md} color={colors.icon.interactive} strokeWidth={2} />
        </View>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: colors.surface.brandTint }]}>
            <AppText variant="caption" style={{ color: colors.text.interactive }}>{badge}</AppText>
          </View>
        ) : null}
      </Row>
      <View>
        <AppText variant="caption" color="secondary">{label}</AppText>
        <AppText variant="numeric" color="heading">{value}</AppText>
        <AppText variant="caption" style={{ color: detailColor ?? colors.text.secondary }}>{detail}</AppText>
      </View>
      {progress !== undefined ? (
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: progress }}
          style={[styles.track, { backgroundColor: colors.surface.raised }]}
        >
          <View
            style={[
              styles.fill,
              { width: `${Math.max(0, Math.min(100, progress))}%`, backgroundColor: colors.action.primary.default },
            ]}
          />
        </View>
      ) : (
        <Row align="center" gap="xs">
          <AppText variant="caption" style={{ color: colors.text.interactive }}>View all</AppText>
          <ArrowRight size={sizes.icon.sm} color={colors.icon.interactive} />
        </Row>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  panel: { borderRadius: radius.surface, overflow: 'hidden' },
  panelHeader: { minHeight: sizes.minimumTouchTarget, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  count: { minWidth: 20, height: 20, paddingHorizontal: 4, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  taskRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1 },
  showAll: { minHeight: sizes.minimumTouchTarget, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1 },
  well: { width: 36, height: 36, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  tile: { flexBasis: '47%', flexGrow: 1, minHeight: 148, padding: 16, gap: 8, borderRadius: radius.tile, justifyContent: 'space-between' },
  badge: { minWidth: 24, height: 24, paddingHorizontal: 8, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  track: { height: 4, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
