import React, { useEffect, useMemo, useState } from 'react';
import { ProfileAvatarButton } from '../../components/navigation/ProfileAvatarButton';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAppSelector } from '../../app/store/hooks';
import { AttentionPanel, MetricTile, type AttentionItem } from './HomeSections';
import {
  AlertCircle,
  Folder,
  FileText,
  HeartPulse,
  ListChecks,
  Plus,
  Search,
  TrendingUp,
  WalletCards,
  ChevronRight,
} from 'lucide-react-native';

import { useBootstrapQuery, usePackagesQuery } from '../../services/api';
import { healthApi, type HealthHomeReminder } from '../../api/health.api';
import { syncReminderNotifications } from '../../notifications/reminderNotifications';
import { wealthApi, type WealthRecord } from '../../api/wealth.api';
import type { DocumentRecord } from '../../api/types';
import { calculatePackReadiness } from '../readiness/calculatePackReadiness';
import type { MainTabParamList, RootStackParamList } from '../../app/navigation/types';
import { GlobalSearchModal } from './GlobalSearchModal';
import type { GlobalSearchResult } from '../../api/search.api';

import { useAppTheme } from '../../design/theme/ThemeProvider';

import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { Row } from '../../components/primitives/Row';
import { ListGroup, ListRow } from '../../components/primitives/ListRow';
import { SectionHeader } from '../../components/primitives/SectionHeader';
import { Tile, type StatusTone } from '../../components/primitives/Tile';
import { AppText } from '../../components/primitives/AppText';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import { fontSize, lineHeight, fontWeights} from '../../design/tokens/typography';

import { SkeletonList } from '../../components/feedback/SkeletonList';
import { ErrorState } from '../../components/feedback/ErrorState';

const DAY = 86_400_000;

function daysUntil(value?: string | null, now = Date.now()) {
  if (!value) return undefined;
  const time = Date.parse(value);
  return Number.isNaN(time) ? undefined : Math.ceil((time - now) / DAY);
}

function dueLabel(value: string | null | undefined, now: number) {
  const days = daysUntil(value, now);
  if (days === undefined) return 'Due soon';
  if (days < 0) return `Overdue by ${-days} ${days === -1 ? 'day' : 'days'}`;
  return days === 0 ? 'Due today' : `Due in ${days} ${days === 1 ? 'day' : 'days'}`;
}

function documentTitle(document: DocumentRecord) {
  return document.displayName ?? document.title ?? document.originalName ?? document.documentType;
}

export function HomeScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<MainTabParamList, 'Home'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();
  const user = useAppSelector(state => state.auth.user);
  const [expanded, setExpanded] = useState(false);
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
      .then(items => {
        if (active) setHealthReminders(items);
        void syncReminderNotifications(items);
      })
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
        <SkeletonList label="Loading overview…" />
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
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.trim().split(' ')[0] || 'there';
  const attentionItems: Array<AttentionItem & { sort: number }> = [
    ...expiringDocuments.map(document => ({
      id: `document-${document.id}`,
      Icon: FileText,
      title: documentTitle(document),
      label: dueLabel(document.expiryDate, now),
      overdue: (daysUntil(document.expiryDate, now) ?? 0) < 0,
      sort: daysUntil(document.expiryDate, now) ?? 0,
      onPress: () => navigation.navigate('Documents'),
    })),
    ...healthReminders.map(reminder => ({
      id: `reminder-${reminder.id}`,
      Icon: HeartPulse,
      title: `${reminder.memberName} · ${reminder.title}`,
      label: dueLabel(reminder.dueDate, now),
      overdue: (daysUntil(reminder.dueDate, now) ?? 0) < 0,
      sort: daysUntil(reminder.dueDate, now) ?? 0,
      onPress: () => navigation.navigate('Health'),
    })),
    ...renewalsDue.map(record => {
      const date = String(record.details.renewalDate ?? record.details.maturityDate ?? '');
      return {
        id: `wealth-${record.id}`,
        Icon: TrendingUp,
        title: record.title,
        label: dueLabel(date, now),
        overdue: (daysUntil(date, now) ?? 0) < 0,
        sort: daysUntil(date, now) ?? 0,
        onPress: () => navigation.navigate('Wealth'),
      };
    }),
  ].sort((a, b) => a.sort - b.sort);

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
      <Stack gap="lg" style={styles.container}>
        <Row align="center" justify="space-between" style={styles.appBar}>
          <Stack gap="xs" style={styles.greeting}>
            <AppText variant="title" numberOfLines={1}>{greeting}, {firstName}</AppText>
            <AppText variant="bodySm" color="secondary">Here's your ReadiNes overview</AppText>
          </Stack>
          <Row gap="sm">
            <Pressable
              onPress={() => setSearchOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Search"
              style={[styles.headerButton, { borderColor: theme.colors.border.default, backgroundColor: theme.colors.surface.default }]}
            >
              <Search size={sizes.icon.md} color={theme.colors.text.secondary} strokeWidth={2} />
            </Pressable>
            <ProfileAvatarButton />
          </Row>
        </Row>

        <AttentionPanel
          items={attentionItems}
          emptyMessage="No tasks need your attention."
          expanded={expanded}
          onToggle={() => setExpanded(value => !value)}
        />

        <View style={styles.grid}>
          <MetricTile
            label="Documents"
            value={documents.length}
            detail={`${expiringDocuments.length} expiring soon`}
            detailColor={expiredDocuments.length ? theme.colors.status.danger.text : undefined}
            badge={expiringDocuments.length || undefined}
            Icon={Folder}
            onPress={() => navigation.navigate('Documents')}
          />
          <MetricTile
            label="Packages"
            value={`${situationStats.ready}/${situationStats.total}`}
            detail={`${readyPercent}% ready`}
            badge={readyPercent === 100 ? '✓' : `${readyPercent}%`}
            progress={readyPercent}
            Icon={ListChecks}
            onPress={() => navigation.navigate('Packages')}
          />
          <MetricTile
            label="Health"
            value={healthReminders.length}
            detail={healthReminders.length === 1 ? 'task pending' : 'tasks pending'}
            detailColor={overdueReminders.length ? theme.colors.status.danger.text : undefined}
            badge={healthReminders.length || undefined}
            Icon={HeartPulse}
            onPress={() => navigation.navigate('Health')}
          />
          <MetricTile
            label="Wealth"
            value={renewalsDue.length}
            detail={renewalsDue.length === 1 ? 'renewal due' : 'renewals due'}
            badge={renewalsDue.length || undefined}
            Icon={WalletCards}
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

        <View style={styles.section}>
          <SectionHeader title="Quick actions" />
          <View style={styles.grid}>
            <Tile
              icon={Plus}
              title="Add document"
              status="Upload a new file"
              onPress={() => navigation.navigate('Documents')}
            />
            <Tile
              icon={ListChecks}
              title="Create package"
              status="Organise what you need"
              onPress={() => navigation.navigate('Packages')}
            />
          </View>
        </View>

        {recentDocuments.length ? (
          <View style={styles.section}>
            <SectionHeader
              title="Recently added"
              actionLabel="See all"
              onAction={() => navigation.navigate('Documents')}
            />
            <ListGroup>
              {recentDocuments.slice(0, 3).map(document => (
                <ListRow
                  key={document.id}
                  icon={<FileText size={sizes.icon.md} color={theme.colors.icon.interactive} strokeWidth={2} />}
                  title={documentTitle(document)}
                  subtitle={document.category ?? document.documentType}
                  onPress={() => navigation.navigate('Documents')}
                />
              ))}
            </ListGroup>
          </View>
        ) : null}
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 24 },
  appBar: { minHeight: sizes.header },
  greeting: { flex: 1, paddingRight: 8 },
  headerButton: { width: 44, height: 44, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  retryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },

  section: { gap: 8 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  needsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radius.surface,
  },
  needsIcon: { width: 32, height: 32, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  needsCopy: { flex: 1, gap: 2 },
  needsTitle: { fontSize: fontSize.bodySm, lineHeight: lineHeight.bodySm, fontWeight: fontWeights.semibold },
  needsSubtitle: { fontSize: fontSize.caption, lineHeight: lineHeight.caption },
});
