import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  ArrowRight,
  ChevronRight,
  FileText,
  Shield,
  type LucideIcon,
} from 'lucide-react-native';

import { AppText } from '../../components/primitives/AppText';
import { Row } from '../../components/primitives/Row';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { shadows } from '../../design/tokens/shadows';
import { sizes } from '../../design/tokens/sizes';
import { SectionHeader } from '../../components/primitives/SectionHeader';
import type { DocumentRecord } from '../../api/types';
import { documentIcon } from '../documents/documentIcon';

export function RecentDocuments({
  documents,
  onOpen,
  onViewAll,
}: {
  documents: DocumentRecord[];
  onOpen: (document: DocumentRecord) => void;
  onViewAll: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.recentSection}>
      <SectionHeader
        title="Recently viewed"
        actionLabel="View all"
        onAction={onViewAll}
      />
      {documents.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentList}
        >
          {documents.map(document => {
          const title =
            document.displayName ??
            document.title ??
            document.originalName ??
            document.documentType;
          const category = document.category ?? document.documentType;
          const Icon = documentIcon(document);
          return (
            <View
              key={document.id}
              style={[
                styles.recentCard,
                {
                  backgroundColor: theme.colors.surface.default,
                  borderColor: theme.colors.border.subtle,
                },
              ]}
            >
              <View style={styles.recentCardHeader}>
                <View style={styles.recentCardTitle}>
                  <AppText variant="labelMd" numberOfLines={1}>
                    {title}
                  </AppText>
                  <AppText variant="caption" color="secondary" numberOfLines={1}>
                    {document.originalName}
                  </AppText>
                </View>
                <View
                  style={[
                    styles.categoryBadge,
                    {
                      backgroundColor: theme.colors.surface.brandTint,
                      borderColor: theme.colors.border.interactive,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    style={{ color: theme.colors.text.interactive }}
                    numberOfLines={1}
                  >
                    {category}
                  </AppText>
                </View>
              </View>
              <View style={styles.recentCardFooter}>
                <View
                  style={[
                    styles.documentIcon,
                    { backgroundColor: theme.colors.surface.brandTint },
                  ]}
                >
                  <Icon
                    size={sizes.icon.lg}
                    color={theme.colors.icon.interactive}
                  />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`View ${title}`}
                  onPress={() => onOpen(document)}
                  style={[
                    styles.viewDocument,
                    { borderColor: theme.colors.border.interactive },
                  ]}
                >
                  <AppText
                    variant="caption"
                    style={{ color: theme.colors.text.interactive }}
                  >
                    View document
                  </AppText>
                  <ChevronRight
                    size={sizes.icon.sm}
                    color={theme.colors.icon.interactive}
                  />
                </Pressable>
              </View>
            </View>
          );
          })}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.recentEmpty,
            {
              backgroundColor: theme.colors.surface.default,
              borderColor: theme.colors.border.subtle,
            },
          ]}
        >
          <View
            style={[
              styles.documentIcon,
              { backgroundColor: theme.colors.surface.brandTint },
            ]}
          >
            <FileText
              size={sizes.icon.lg}
              color={theme.colors.icon.interactive}
            />
          </View>
          <View style={styles.recentEmptyCopy}>
            <AppText variant="compactLabel">No documents yet</AppText>
            <AppText variant="caption" color="secondary">
              Documents you add will appear here.
            </AppText>
          </View>
        </View>
      )}
    </View>
  );
}

export function AttentionBanner({
  count,
  overdueCount,
  expanded,
  onPress,
}: {
  count: number;
  overdueCount: number;
  expanded: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        count
          ? `${count} items need your attention`
          : 'No items need your attention'
      }
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={[
        styles.attentionBanner,
        {
          backgroundColor: theme.colors.surface.brandTint,
          borderColor: theme.colors.border.interactive,
        },
      ]}
    >
      <View
        style={[
          styles.attentionIcon,
          { backgroundColor: theme.colors.action.primary.default },
        ]}
      >
        <Shield
          size={sizes.icon.sm}
          color={theme.colors.text.onBrand}
          strokeWidth={2}
        />
      </View>
      <View style={styles.attentionCopy}>
        <AppText variant="compactLabel">
          {count
            ? `${count} ${count === 1 ? 'item' : 'items'} need your attention`
            : 'No items need your attention'}
        </AppText>
        <AppText
          variant="caption"
          style={{ color: theme.colors.text.interactive }}
        >
          {count
            ? `${overdueCount} overdue · ${expanded ? 'Hide details' : 'View all'}`
            : "You're all caught up"}
        </AppText>
      </View>
      <ChevronRight
        size={sizes.icon.sm}
        color={theme.colors.icon.interactive}
      />
    </Pressable>
  );
}

export function HomeQuickAction({
  title,
  status,
  icon: Icon,
  onPress,
}: {
  title: string;
  status: string;
  icon: LucideIcon;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${status}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        {
          backgroundColor: theme.colors.surface.secondary,
          borderColor: theme.colors.border.subtle,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.quickActionIcon,
          { backgroundColor: theme.colors.surface.brandTint },
        ]}
      >
        <Icon size={sizes.icon.sm} color={theme.colors.icon.interactive} />
      </View>
      <View style={styles.quickActionCopy}>
        <AppText variant="compactLabel" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="caption" color="muted" numberOfLines={1}>
          {status}
        </AppText>
      </View>
    </Pressable>
  );
}

export function HomeEssentialsBanner() {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        styles.essentialsBanner,
        {
          backgroundColor: theme.colors.surface.secondary,
          borderColor: theme.colors.border.subtle,
        },
      ]}
    >
      <View
        style={[
          styles.essentialsIcon,
          { backgroundColor: theme.colors.surface.brandTint },
        ]}
      >
        <Shield
          size={sizes.icon.md}
          color={theme.colors.icon.interactive}
          strokeWidth={2}
        />
      </View>
      <View style={styles.essentialsCopy}>
        <AppText variant="compactLabel">Your essentials, in one place.</AppText>
        <AppText variant="caption" color="muted">
          Secure access to documents, packages, health, and wealth.
        </AppText>
      </View>
    </View>
  );
}

export type AttentionItem = {
  id: string;
  kind: 'document' | 'other';
  Icon: LucideIcon;
  title: string;
  label: string;
  overdue: boolean;
  onPress: () => void;
};

const PREVIEW_COUNT = 3;

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
  const hasMore = (['document', 'other'] as const).some(
    kind => items.filter(item => item.kind === kind).length > PREVIEW_COUNT,
  );

  return (
    <View style={styles.attentionSection}>
      <View style={styles.panelHeader}>
        <AppText variant="heading" color="heading" style={styles.flex}>Needs attention</AppText>
        <View style={[styles.count, { backgroundColor: colors.surface.brandTint }]}>
          <AppText variant="caption" style={{ color: colors.text.interactive }}>{items.length}</AppText>
        </View>
      </View>

      {(['document', 'other'] as const).map(kind => {
        const group = items.filter(item => item.kind === kind);
        const visible = group.slice(0, expanded ? undefined : PREVIEW_COUNT);
        if (!group.length) return null;
        return (
          <View
            key={kind}
            accessibilityLabel={kind === 'document' ? 'Documents needing attention' : 'Other reminders needing attention'}
            style={[styles.panel, shadows.card, { backgroundColor: colors.surface.default }]}
          >
            <View style={styles.groupHeader}>
              <View style={styles.flex}>
                <AppText variant="labelMd" color="heading">
                  {kind === 'document' ? 'Documents' : 'Other reminders'}
                </AppText>
                <AppText variant="caption" color="secondary">
                  {kind === 'document' ? 'Expiring or expired' : 'Health and wealth'}
                </AppText>
              </View>
              <View style={[styles.groupCount, { backgroundColor: colors.surface.inset }]}>
                <AppText variant="caption" color="secondary">{group.length}</AppText>
              </View>
            </View>
            {visible.map(({ id, Icon, title, label, overdue, onPress }) => (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityLabel={`${title}, ${label}`}
                onPress={onPress}
                style={[styles.taskRow, { borderTopColor: colors.border.subtle }]}
              >
                <View style={[styles.well, { backgroundColor: colors.surface.brandTint }]}>
                  <Icon size={sizes.icon.md} color={colors.icon.interactive} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="labelMd" numberOfLines={2}>{title}</AppText>
                  <AppText variant="caption" style={{ color: overdue ? colors.status.danger.text : colors.text.secondary }}>
                    {label}
                  </AppText>
                </View>
                <ChevronRight size={sizes.icon.sm} color={colors.icon.secondary} />
              </Pressable>
            ))}
          </View>
        );
      })}

      {!items.length ? (
        <View style={[styles.emptyCard, shadows.card, { backgroundColor: colors.surface.default }]}>
          <AppText variant="bodySm" color="secondary">{emptyMessage}</AppText>
        </View>
      ) : hasMore ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={onToggle}
          style={styles.showAll}
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
  recentSection: { gap: 8 },
  recentList: { gap: 12, paddingRight: 16 },
  recentEmpty: {
    minHeight: 112,
    padding: 12,
    borderWidth: 1,
    borderRadius: radius.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentEmptyCopy: { flex: 1, gap: 4 },
  recentCard: {
    width: 312,
    minHeight: 148,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderRadius: radius.overlay,
    justifyContent: 'space-between',
  },
  recentCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  recentCardTitle: { flex: 1, gap: 4 },
  categoryBadge: {
    maxWidth: 96,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: radius.control,
  },
  recentCardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  documentIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDocument: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: radius.control,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  attentionBanner: {
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: radius.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attentionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionCopy: { flex: 1, gap: 2 },
  quickAction: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radius.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionCopy: { flex: 1, gap: 2 },
  essentialsBanner: {
    minHeight: 72,
    padding: 12,
    borderWidth: 1,
    borderRadius: radius.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  essentialsIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  essentialsCopy: { flex: 1, gap: 2 },
  attentionSection: { gap: 12 },
  panel: { borderRadius: radius.surface, overflow: 'hidden' },
  panelHeader: { minHeight: sizes.minimumTouchTarget, flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  count: { minWidth: 24, height: 24, paddingHorizontal: 8, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  groupCount: { minWidth: 28, height: 28, paddingHorizontal: 8, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  taskRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1 },
  emptyCard: { borderRadius: radius.surface, padding: 16 },
  showAll: { minHeight: sizes.minimumTouchTarget, alignItems: 'center', justifyContent: 'center' },
  well: { width: 36, height: 36, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  tile: { flexBasis: '47%', flexGrow: 1, minHeight: 148, padding: 16, gap: 8, borderRadius: radius.tile, justifyContent: 'space-between' },
  badge: { minWidth: 24, height: 24, paddingHorizontal: 8, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  track: { height: 4, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
