import React, { useEffect, useMemo, useState } from 'react';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  AlertCircle,
  ArrowRight,
  Folder,
  FileText,
  HeartPulse,
  ListChecks,
  Plus,
  Search,
  WalletCards,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';

import { useBootstrapQuery, usePackagesQuery } from '../../services/api';
import { healthApi, type HealthHomeReminder } from '../../api/health.api';
import { wealthApi, type WealthRecord } from '../../api/wealth.api';
import type { DocumentRecord } from '../../api/types';
import { readinessTone } from '../readiness/readinessTone';
import { calculatePackReadiness } from '../readiness/calculatePackReadiness';
import type { MainTabParamList, RootStackParamList } from '../../app/navigation/types';
import { parseHomeOverview } from './homeSelectors';
import { GlobalSearchModal } from './GlobalSearchModal';
import type { GlobalSearchResult } from '../../api/search.api';

import { useAppTheme } from '../../design/theme/ThemeProvider';

import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { Row } from '../../components/primitives/Row';
import { AppText } from '../../components/primitives/AppText';
import { BrandLogo } from '../../components/BrandLogo';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import { shadows } from '../../design/tokens/shadows';
import { fontSize, lineHeight } from '../../design/tokens/typography';

import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';

const DAY = 86_400_000;

function daysUntil(value?: string | null, now = Date.now()) {
  if (!value) return undefined;
  const time = Date.parse(value);
  return Number.isNaN(time) ? undefined : Math.ceil((time - now) / DAY);
}

function documentTitle(document: DocumentRecord) {
  return document.displayName ?? document.title ?? document.originalName ?? document.documentType;
}

function RecentDocumentCard({
  document,
  onPress,
}: {
  document: DocumentRecord;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${documentTitle(document)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.recentCard,
        shadows.card,
        { backgroundColor: theme.colors.surface.raised, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.recentTop}>
        <View style={styles.recentCopy}>
          <AppText variant="label" numberOfLines={1} style={styles.recentTitle}>
            {documentTitle(document)}
          </AppText>
          <AppText variant="caption" numberOfLines={1} style={styles.recentSubtitle}>
            {document.owner ?? document.originalName}
          </AppText>
        </View>
      </View>
      <View style={styles.recentBottom}>
        <View style={[styles.thumb, { backgroundColor: theme.colors.surface.brandTint }]}>
          <FileText size={26} color={theme.colors.icon.interactive} strokeWidth={1.8} />
        </View>
        <View style={styles.recentRight}>
          <View style={[styles.badge, { backgroundColor: theme.colors.surface.brandTint, borderColor: theme.colors.border.subtle }]}>
            <AppText style={[styles.badgeText, { color: theme.colors.text.interactive }]}>{document.category ?? 'Document'}</AppText>
          </View>
          <View style={[styles.viewButton, { borderColor: theme.colors.border.interactive }]}>
            <AppText style={[styles.viewButtonText, { color: theme.colors.text.interactive }]}>View document</AppText>
            <ArrowRight size={16} color={theme.colors.icon.interactive} strokeWidth={2} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

type StatusTone = 'success' | 'warning' | 'danger' | 'info';

function SummaryCard({
  Icon,
  tone,
  badge,
  label,
  value,
  note,
  onPress,
}: {
  Icon: LucideIcon;
  tone: StatusTone;
  badge: string;
  label: string;
  value: string;
  note: string;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}, ${note}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.summaryCard,
        shadows.card,
        { backgroundColor: theme.colors.surface.raised, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.summaryTop}>
        <View style={[styles.summaryIcon, { backgroundColor: theme.colors.surface.brandTint }]}>
          <Icon size={sizes.icon.md} color={theme.colors.icon.interactive} strokeWidth={2} />
        </View>
        <View style={[styles.summaryBadge, { backgroundColor: theme.colors.status[tone].surface, borderColor: theme.colors.status[tone].border }]}>
          <AppText style={[styles.summaryBadgeText, { color: theme.colors.status[tone].text }]}>{badge}</AppText>
        </View>
      </View>
      <View style={styles.summaryBody}>
        <AppText style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>{label}</AppText>
        <AppText style={[styles.summaryValue, { color: theme.colors.text.primary }]}>{value}</AppText>
        <AppText style={[styles.summaryNote, { color: theme.colors.text.secondary }]}>{note}</AppText>
      </View>
      <View style={styles.viewAll}>
        <AppText style={[styles.viewAllText, { color: theme.colors.text.interactive }]}>View all</AppText>
        <ArrowRight size={sizes.icon.sm} color={theme.colors.icon.interactive} strokeWidth={2} />
      </View>
    </Pressable>
  );
}

function QuickAction({
  Icon,
  title,
  subtitle,
  onPress,
}: {
  Icon: LucideIcon;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        shadows.card,
        {
          backgroundColor: theme.colors.surface.raised,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.quickIcon, { backgroundColor: theme.colors.surface.brandTint }]}>
        <Icon size={18} color={theme.colors.icon.interactive} strokeWidth={2} />
      </View>
      <View style={styles.quickCopy}>
        <AppText style={styles.quickTitle} numberOfLines={1}>{title}</AppText>
        <AppText style={[styles.quickSubtitle, { color: theme.colors.text.tertiary }]} numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
    </Pressable>
  );
}

export function HomeScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<MainTabParamList, 'Home'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearchResult = (result: GlobalSearchResult) => {
    const segment = result.navigation.path.split(/[/?#]/).find(Boolean);
    if (segment === 'documents') navigation.navigate('Documents');
    else if (segment === 'packages') navigation.navigate('Packages');
    else if (segment === 'health') navigation.navigate('Health');
    else if (segment === 'wealth') navigation.navigate('Wealth');
  };
  const [healthReminders, setHealthReminders] = useState<HealthHomeReminder[]>([]);
  const [reminderError, setReminderError] = useState<string>();

  useEffect(() => {
    let active = true;
    healthApi.reminders()
      .then(items => { if (active) setHealthReminders(items); })
      .catch(error => {
        if (active) setReminderError(error instanceof Error ? error.message : 'Unable to load reminders.');
      });
    return () => { active = false; };
  }, []);

  const [wealthRecords, setWealthRecords] = useState<WealthRecord[]>([]);

  useEffect(() => {
    let active = true;
    wealthApi.records()
      .then(items => { if (active) setWealthRecords(items); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // --------------------------------------------------------------------------
  // Existing API — unchanged
  // --------------------------------------------------------------------------

  const bootstrap = useBootstrapQuery();
  const [packagePage, setPackagePage] = useState(1);
  const packages = usePackagesQuery({ page: packagePage, limit: 20 });

  useEffect(() => {
    if (
      !packages.isFetching &&
      !packages.isError &&
      packages.data?.pagination.hasNextPage
    ) {
      setPackagePage(page => page + 1);
    }
  }, [packages.data?.pagination.hasNextPage, packages.isError, packages.isFetching]);

  const situationStats = useMemo(() => {
    const items = packages.data?.items ?? [];
    const documents = bootstrap.data?.documents ?? [];
    const ready = items.filter(item => {
      const readiness = calculatePackReadiness(item.requirements, documents);
      return readiness.totalRequired > 0 && readiness.missingRequired === 0;
    }).length;
    return {
      ready,
      total: packages.data?.pagination.total ?? items.length,
    };
  }, [bootstrap.data?.documents, packages.data]);

  // --------------------------------------------------------------------------
  // Loading — unchanged functionality
  // --------------------------------------------------------------------------

  if (bootstrap.isLoading) {
    return (
      <Screen>
        <LoadingState fill label="Loading your readiness overview…" />
      </Screen>
    );
  }

  // --------------------------------------------------------------------------
  // Error — unchanged functionality
  // --------------------------------------------------------------------------

  if (
    bootstrap.error ||
    !bootstrap.data
  ) {
    return (
      <Screen>
        <Stack
          gap="md"
          style={{
            padding: theme.spacing.lg,
          }}
        >
          <ErrorState
            message="Unable to load your readiness overview."
          />

          <Pressable
            onPress={() =>
              bootstrap.refetch()
            }
            style={[
              styles.retryButton,
              {
                backgroundColor:
                  theme.colors.action.primary.default,
                borderRadius:
                  theme.radius.control,
              },
            ]}
          >
            <AppText
              variant="label"
              color="onPrimary"
              align="center"
            >
              Retry
            </AppText>
          </Pressable>
        </Stack>
      </Screen>
    );
  }

  // --------------------------------------------------------------------------
  // Existing selector — unchanged
  // --------------------------------------------------------------------------

  const homeOverview =
    parseHomeOverview(
      bootstrap.data,
    );

  const documents = bootstrap.data.documents ?? [];
  const now = Date.now();
  const recentDocuments = [...documents]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, 5);
  const expiringDocuments = documents.filter(document => {
    const days = daysUntil(document.expiryDate, now);
    return days !== undefined && days <= 60;
  });
  const expiredDocuments = expiringDocuments.filter(document => (daysUntil(document.expiryDate, now) ?? 0) < 0);
  const overdueReminders = healthReminders.filter(reminder => (daysUntil(reminder.dueDate, now) ?? 0) < 0);
  const renewalsDue = wealthRecords.filter(record => {
    const days = daysUntil(String(record.details.renewalDate ?? record.details.maturityDate ?? ''), now);
    return days !== undefined && days <= 30;
  });
  const attentionCount = expiringDocuments.length + healthReminders.length + renewalsDue.length;
  const overdueCount = expiredDocuments.length + overdueReminders.length;
  const bannerTone: StatusTone = overdueCount ? 'danger' : 'warning';
  const readyPercent = situationStats.total
    ? Math.round((situationStats.ready / situationStats.total) * 100)
    : 0;

  return (
    <Screen
      scroll
      padded={false}
      onRefresh={() => Promise.all([bootstrap.refetch(), packages.refetch()])}
    >
      <GlobalSearchModal
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        onOpenResult={openSearchResult}
      />
      <Stack gap="md" style={styles.container}>
        <Row align="center" justify="space-between" style={styles.appBar}>
          <Row align="center" gap="sm">
            <BrandLogo size={26} />
            <AppText variant="heading">ReadiNes</AppText>
          </Row>
          <Row gap="sm">
            <Pressable
              onPress={() => setSearchOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Search"
              style={[styles.headerButton, { borderColor: theme.colors.border.default, backgroundColor: theme.colors.surface.default }]}
            >
              <Search size={22} color={theme.colors.text.secondary} strokeWidth={2} />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('Profile')}
              accessibilityRole="button"
              accessibilityLabel="Profile"
              style={[styles.avatar, { borderColor: theme.colors.border.default, backgroundColor: theme.colors.surface.raised }]}
            >
              <AppText variant="heading" color="secondary" align="center">
                {homeOverview.name.charAt(0).toUpperCase()}
              </AppText>
            </Pressable>
          </Row>
        </Row>

        {recentDocuments.length ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText style={styles.sectionTitle}>Recently viewed</AppText>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentRow}
            >
              {recentDocuments.map(document => (
                <RecentDocumentCard
                  key={document.id}
                  document={document}
                  onPress={() => navigation.navigate('Documents')}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.grid}>
          <SummaryCard
            Icon={Folder}
            tone={expiringDocuments.length ? 'warning' : 'success'}
            badge={String(expiringDocuments.length)}
            label="Documents"
            value={String(documents.length)}
            note={`${expiringDocuments.length} expiring soon`}
            onPress={() => navigation.navigate('Documents')}
          />
          <SummaryCard
            Icon={ListChecks}
            tone={readinessTone(readyPercent)}
            badge={`${readyPercent}%`}
            label="Packages"
            value={`${situationStats.ready}/${situationStats.total}`}
            note={`${readyPercent}% ready`}
            onPress={() => navigation.navigate('Packages')}
          />
          <SummaryCard
            Icon={HeartPulse}
            tone={overdueReminders.length ? 'danger' : healthReminders.length ? 'warning' : 'success'}
            badge={String(healthReminders.length)}
            label="Health"
            value={String(healthReminders.length)}
            note="Tasks pending"
            onPress={() => navigation.navigate('Health')}
          />
          <SummaryCard
            Icon={WalletCards}
            tone={renewalsDue.length ? 'info' : 'success'}
            badge={String(renewalsDue.length)}
            label="Wealth"
            value={String(renewalsDue.length)}
            note="Renewals due"
            onPress={() => navigation.navigate('Wealth')}
          />
        </View>

        {reminderError ? (
          <AppText variant="caption" color="secondary">Reminders are temporarily unavailable.</AppText>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${attentionCount} items need your attention`}
          onPress={() => navigation.navigate(healthReminders.length ? 'Health' : 'Documents')}
          style={({ pressed }) => [
            styles.needsBanner,
            {
              borderColor: theme.colors.status[bannerTone].border,
              backgroundColor: theme.colors.status[bannerTone].surface,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View style={styles.needsIcon}>
            <AlertCircle size={sizes.icon.md} color={theme.colors.status[bannerTone].icon} strokeWidth={2} />
          </View>
          <View style={styles.needsCopy}>
            <AppText style={[styles.needsTitle, { color: theme.colors.status[bannerTone].text }]}>
              {attentionCount} {attentionCount === 1 ? 'item needs' : 'items need'} your attention
            </AppText>
            <AppText style={[styles.needsSubtitle, { color: theme.colors.status[bannerTone].text }]}>
              {overdueCount} overdue · View all
            </AppText>
          </View>
          <ChevronRight size={sizes.icon.sm} color={theme.colors.status[bannerTone].icon} strokeWidth={2} />
        </Pressable>

        <View style={styles.quickSection}>
          <View style={styles.quickHeader}>
            <AppText style={styles.quickHeading}>Quick actions</AppText>
            <AppText style={styles.quickHint}>Add or create</AppText>
          </View>
          <View style={styles.quickRow}>
            <QuickAction
              Icon={Plus}
              title="Add document"
              subtitle="Upload a new file"
              onPress={() => navigation.navigate('Documents')}
            />
            <QuickAction
              Icon={ListChecks}
              title="Create package"
              subtitle="Organize items"
              onPress={() => navigation.navigate('Packages')}
            />
          </View>
        </View>
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 24 },
  appBar: { minHeight: sizes.header },
  headerButton: { width: 44, height: 44, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 44, height: 44, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  retryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },

  section: { gap: 8 },
  sectionHeader: { paddingLeft: 4 },
  sectionTitle: { fontSize: fontSize.body, lineHeight: lineHeight.body, fontWeight: '600' },
  recentRow: { gap: 12, paddingRight: 16 },
  recentCard: {
    width: 312,
    height: 148,
    padding: 16,
    borderRadius: radius.overlay,
    justifyContent: 'space-between',
  },
  recentTop: { flexDirection: 'row', justifyContent: 'space-between' },
  recentCopy: { gap: 4, flex: 1 },
  recentTitle: { fontSize: fontSize.body, lineHeight: lineHeight.body, fontWeight: '600' },
  recentSubtitle: { fontSize: fontSize.caption, lineHeight: lineHeight.caption },
  recentBottom: { flexDirection: 'row', alignItems: 'flex-end', gap: 16 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentRight: { flex: 1, gap: 8, alignItems: 'flex-start' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.control,
    borderWidth: 1,
  },
  badgeText: { fontSize: fontSize.caption, lineHeight: lineHeight.caption, fontWeight: '500' },
  viewButton: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: radius.control,
  },
  viewButtonText: { fontSize: fontSize.caption, lineHeight: lineHeight.caption },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryCard: {
    width: '47.9%',
    flexGrow: 1,
    height: 148,
    padding: 14,
    borderRadius: radius.tile,
    justifyContent: 'space-between',
  },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryIcon: { width: 32, height: 32, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  summaryBadge: { minWidth: 20, height: 20, borderRadius: radius.surface, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  summaryBadgeText: { fontSize: fontSize.caption, lineHeight: lineHeight.caption, fontWeight: '700' },
  summaryBody: { gap: 3 },
  summaryLabel: { fontSize: fontSize.caption, lineHeight: lineHeight.caption },
  summaryValue: { fontSize: fontSize.headingMd, lineHeight: lineHeight.headingMd, fontWeight: '700' },
  summaryNote: { fontSize: fontSize.caption, lineHeight: lineHeight.caption },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllText: { fontSize: fontSize.caption, lineHeight: lineHeight.caption },

  needsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: radius.surface,
  },
  needsIcon: { width: 32, height: 32, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  needsCopy: { flex: 1, gap: 2 },
  needsTitle: { fontSize: fontSize.bodySm, lineHeight: lineHeight.bodySm, fontWeight: '600' },
  needsSubtitle: { fontSize: fontSize.caption, lineHeight: lineHeight.caption },

  quickSection: { gap: 10 },
  quickHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 4 },
  quickHeading: { fontSize: fontSize.bodySm, lineHeight: lineHeight.bodySm, fontWeight: '600' },
  quickHint: { fontSize: fontSize.caption, lineHeight: lineHeight.caption },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickAction: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: radius.surface,
  },
  quickIcon: { width: 32, height: 32, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  quickCopy: { flex: 1, gap: 2 },
  quickTitle: { fontSize: fontSize.bodySm, lineHeight: lineHeight.bodySm, fontWeight: '600' },
  quickSubtitle: { fontSize: fontSize.caption, lineHeight: lineHeight.caption },

});
