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
  ShieldCheck,
  WalletCards,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';

import { useBootstrapQuery, usePackagesQuery } from '../../services/api';
import { healthApi, type HealthHomeReminder } from '../../api/health.api';
import { wealthApi, type WealthRecord } from '../../api/wealth.api';
import type { DocumentRecord } from '../../api/types';
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
import { BrandMark } from '../../components/BrandMark';

import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';

const DAY = 86_400_000;
const ACCENT = '#B79BE6';
const ACCENT_TINT = 'rgba(167, 132, 222, 0.08)';

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
        { backgroundColor: theme.colors.surface, opacity: pressed ? 0.85 : 1 },
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
        <View style={styles.thumb}>
          <FileText size={26} color={ACCENT} strokeWidth={1.8} />
        </View>
        <View style={styles.recentRight}>
          <View style={styles.badge}>
            <AppText style={styles.badgeText}>{document.category ?? 'Document'}</AppText>
          </View>
          <View style={styles.viewButton}>
            <AppText style={styles.viewButtonText}>View document</AppText>
            <ArrowRight size={16} color={ACCENT} strokeWidth={2} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function SummaryCard({
  Icon,
  iconColor,
  badge,
  badgeBackground,
  badgeColor,
  label,
  value,
  note,
  onPress,
}: {
  Icon: LucideIcon;
  iconColor: string;
  badge: string;
  badgeBackground: string;
  badgeColor: string;
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
        { backgroundColor: theme.colors.surface, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.summaryTop}>
        <View style={[styles.summaryIcon, { backgroundColor: theme.colors.surfaceElevated }]}>
          <Icon size={18} color={iconColor} strokeWidth={2} />
        </View>
        <View style={[styles.summaryBadge, { backgroundColor: badgeBackground }]}>
          <AppText style={[styles.summaryBadgeText, { color: badgeColor }]}>{badge}</AppText>
        </View>
      </View>
      <View style={styles.summaryBody}>
        <AppText style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>{label}</AppText>
        <AppText style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>{value}</AppText>
        <AppText style={[styles.summaryNote, { color: theme.colors.danger }]}>{note}</AppText>
      </View>
      <View style={styles.viewAll}>
        <AppText style={styles.viewAllText}>View all</AppText>
        <ArrowRight size={12} color={ACCENT} strokeWidth={2} />
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
        {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.quickIcon}>
        <Icon size={18} color={ACCENT} strokeWidth={2} />
      </View>
      <View style={styles.quickCopy}>
        <AppText style={styles.quickTitle} numberOfLines={1}>{title}</AppText>
        <AppText style={[styles.quickSubtitle, { color: theme.colors.textMuted }]} numberOfLines={1}>
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
    else if (segment === 'family') navigation.navigate('Family');
    else if (segment === 'trust') navigation.navigate('Trust');
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
                  theme.colors.primary,
                borderRadius:
                  theme.radius.md,
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
        <Row align="center" justify="space-between">
          <Row align="center" gap="sm">
            <BrandMark size={26} color={theme.colors.textPrimary} />
            <AppText variant="heading">Readiness</AppText>
          </Row>
          <Row gap="sm">
            <Pressable
              onPress={() => setSearchOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Search"
              style={[styles.headerButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            >
              <Search size={22} color={theme.colors.textSecondary} strokeWidth={2} />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('Profile')}
              accessibilityRole="button"
              accessibilityLabel="Profile"
              style={[styles.avatar, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceElevated }]}
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
            iconColor={ACCENT}
            badge={String(expiringDocuments.length)}
            badgeBackground="#3A1A1D"
            badgeColor="#F5A3A8"
            label="Documents"
            value={String(documents.length)}
            note={`${expiringDocuments.length} expiring soon`}
            onPress={() => navigation.navigate('Documents')}
          />
          <SummaryCard
            Icon={ListChecks}
            iconColor={ACCENT}
            badge={`${readyPercent}%`}
            badgeBackground="#17301F"
            badgeColor="#8FD9AA"
            label="Packages"
            value={`${situationStats.ready}/${situationStats.total}`}
            note={`${readyPercent}% ready`}
            onPress={() => navigation.navigate('Packages')}
          />
          <SummaryCard
            Icon={HeartPulse}
            iconColor="#F08CB4"
            badge={String(healthReminders.length)}
            badgeBackground="#332A12"
            badgeColor="#F0C86A"
            label="Health"
            value={String(healthReminders.length)}
            note="Tasks pending"
            onPress={() => navigation.navigate('Health')}
          />
          <SummaryCard
            Icon={WalletCards}
            iconColor="#E0B45A"
            badge={String(renewalsDue.length)}
            badgeBackground="#172238"
            badgeColor="#9DBEF5"
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
          style={({ pressed }) => [styles.needsBanner, { opacity: pressed ? 0.85 : 1 }]}
        >
          <View style={styles.needsIcon}>
            <AlertCircle size={18} color="#17141F" strokeWidth={2} />
          </View>
          <View style={styles.needsCopy}>
            <AppText style={styles.needsTitle}>
              {attentionCount} {attentionCount === 1 ? 'item needs' : 'items need'} your attention
            </AppText>
            <AppText style={styles.needsSubtitle}>
              {overdueCount} overdue · View all
            </AppText>
          </View>
          <ChevronRight size={16} color={ACCENT} strokeWidth={2} />
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

        <View style={[styles.brandBanner, { backgroundColor: theme.colors.surfaceElevated }]}>
          <View style={styles.brandIcon}>
            <ShieldCheck size={18} color={ACCENT} strokeWidth={2} />
          </View>
          <View style={styles.brandCopy}>
            <AppText style={styles.needsTitle}>Your essentials, in one place.</AppText>
            <AppText style={[styles.quickSubtitle, { color: theme.colors.textMuted }]}>
              Secure access to documents, packages, health, and wealth.
            </AppText>
          </View>
        </View>
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24 },
  headerButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  retryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },

  section: { gap: 8 },
  sectionHeader: { paddingLeft: 4 },
  sectionTitle: { fontSize: 14, lineHeight: 17, fontWeight: '600' },
  recentRow: { gap: 12, paddingRight: 16 },
  recentCard: {
    width: 312,
    height: 148,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A31',
    borderRadius: 20,
    justifyContent: 'space-between',
  },
  recentTop: { flexDirection: 'row', justifyContent: 'space-between' },
  recentCopy: { gap: 4, flex: 1 },
  recentTitle: { fontSize: 14, lineHeight: 17, fontWeight: '600' },
  recentSubtitle: { fontSize: 11, lineHeight: 13 },
  recentBottom: { flexDirection: 'row', alignItems: 'flex-end', gap: 16 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#070930',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentRight: { flex: 1, gap: 8, alignItems: 'flex-start' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(167, 132, 222, 0.2)',
    backgroundColor: ACCENT_TINT,
  },
  badgeText: { fontSize: 10, lineHeight: 12, fontWeight: '500', color: ACCENT },
  viewButton: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#9470CC',
    borderRadius: 8,
  },
  viewButtonText: { fontSize: 11, lineHeight: 13, color: ACCENT },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryCard: {
    width: '47.9%',
    flexGrow: 1,
    height: 148,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2A2A31',
    borderRadius: 16,
    justifyContent: 'space-between',
  },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  summaryBadge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  summaryBadgeText: { fontSize: 10, lineHeight: 12, fontWeight: '700' },
  summaryBody: { gap: 3 },
  summaryLabel: { fontSize: 11, lineHeight: 13 },
  summaryValue: { fontSize: 20, lineHeight: 24, fontWeight: '700' },
  summaryNote: { fontSize: 10, lineHeight: 12 },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllText: { fontSize: 11, lineHeight: 13, color: ACCENT },

  needsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 12,
    backgroundColor: '#2A2537',
  },
  needsIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#A784DE', alignItems: 'center', justifyContent: 'center' },
  needsCopy: { flex: 1, gap: 2 },
  needsTitle: { fontSize: 13, lineHeight: 16, fontWeight: '600' },
  needsSubtitle: { fontSize: 11, lineHeight: 13, color: ACCENT },

  quickSection: { gap: 10 },
  quickHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 4 },
  quickHeading: { fontSize: 13, lineHeight: 16, fontWeight: '600' },
  quickHint: { fontSize: 11, lineHeight: 13, color: ACCENT },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickAction: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  quickIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: ACCENT_TINT, alignItems: 'center', justifyContent: 'center' },
  quickCopy: { flex: 1, gap: 2 },
  quickTitle: { fontSize: 13, lineHeight: 16, fontWeight: '600' },
  quickSubtitle: { fontSize: 10, lineHeight: 12 },

  brandBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14 },
  brandIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: ACCENT_TINT, alignItems: 'center', justifyContent: 'center' },
  brandCopy: { flex: 1, gap: 2 },
});
