import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ProfileAvatarButton } from '../../components/navigation/ProfileAvatarButton';
import { useFocusEffect, useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import { useAppSelector } from '../../app/store/hooks';
import {
  AttentionBanner,
  AttentionPanel,
  HomeEssentialsBanner,
  HomeQuickAction,
  MetricTile,
  RecentDocuments,
  type AttentionItem,
} from './HomeSections';
import {
  getRecentlyViewedDocuments,
  subscribeToRecentlyViewedDocuments,
} from '../documents/recentlyViewedDocuments';
import {
  Folder,
  FileText,
  HeartPulse,
  ListChecks,
  Plus,
  Search,
  TrendingUp,
  WalletCards,
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
import { AppText } from '../../components/primitives/AppText';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import { documentAttention } from './documentAttention';

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
  const [attentionDetailsVisible, setAttentionDetailsVisible] = useState(false);
  const recentlyViewedDocuments = useSyncExternalStore(
    subscribeToRecentlyViewedDocuments,
    getRecentlyViewedDocuments,
    getRecentlyViewedDocuments,
  );
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
        syncReminderNotifications(items).catch(error => console.warn('Unable to schedule reminders', error));
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
  const refetchBootstrap = bootstrap.refetch;
  const focusedOnce = useRef(false);
  useFocusEffect(
    React.useCallback(() => {
      if (focusedOnce.current) refetchBootstrap();
      focusedOnce.current = true;
    }, [refetchBootstrap]),
  );
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
  const documentById = new Map(documents.map(document => [document.id, document]));
  const recentDocuments = [
    ...recentlyViewedDocuments.map(
      document => documentById.get(document.id) ?? document,
    ),
    ...[...documents]
      .filter(
        document =>
          !recentlyViewedDocuments.some(
            recentlyViewed => recentlyViewed.id === document.id,
          ),
      )
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)),
  ].slice(0, 5);
  const expiringDocuments = documents.flatMap(document => {
    const attention = documentAttention(document, new Date(now));
    return attention ? [{ document, attention }] : [];
  });
  const expiredDocuments = expiringDocuments.filter(item => item.attention.overdue);
  const overdueReminders = healthReminders.filter(reminder => (daysUntil(reminder.dueDate, now) ?? 0) < 0);
  const renewalsDue = wealthRecords.filter(record => {
    const days = daysUntil(String(record.details.renewalDate ?? record.details.maturityDate ?? ''), now);
    return days !== undefined && days <= 30;
  });
  const readyPercent = situationStats.total
    ? Math.round((situationStats.ready / situationStats.total) * 100)
    : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.trim().split(' ')[0] || 'there';
  const attentionItems: Array<AttentionItem & { sort: number }> = [
    ...expiringDocuments.map(({ document, attention }) => ({
      id: `document-${document.id}`,
      kind: 'document' as const,
      Icon: FileText,
      title: documentTitle(document),
      label: attention.label,
      overdue: attention.overdue,
      sort: attention.days,
      onPress: () => navigation.navigate('Documents', { documentId: document.id }),
    })),
    ...healthReminders.map(reminder => ({
      id: `reminder-${reminder.id}`,
      kind: 'other' as const,
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
        kind: 'other' as const,
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

        <RecentDocuments
          documents={recentDocuments}
          onOpen={document =>
            navigation.navigate('Documents', { documentId: document.id })
          }
          onViewAll={() => navigation.navigate('Documents')}
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

        <View style={styles.attentionGroup}>
          <AttentionBanner
            count={attentionItems.length}
            overdueCount={attentionItems.filter(item => item.overdue).length}
            expanded={attentionDetailsVisible}
            onPress={() =>
              setAttentionDetailsVisible(value => !value)
            }
          />
          {attentionDetailsVisible ? (
            <AttentionPanel
              items={attentionItems}
              emptyMessage="No tasks need your attention."
              expanded={expanded}
              onToggle={() => setExpanded(value => !value)}
            />
          ) : null}
        </View>

        {reminderError ? (
          <AppText variant="caption" color="secondary">Reminders are temporarily unavailable.</AppText>
        ) : null}

        <View style={styles.section}>
          <Row align="center" justify="space-between" style={styles.quickHeader}>
            <AppText variant="eyebrow">Quick actions</AppText>
            <AppText
              variant="caption"
              style={{ color: theme.colors.text.interactive }}
            >
              Add or create
            </AppText>
          </Row>
          <View style={styles.grid}>
            <HomeQuickAction
              icon={Plus}
              title="Add document"
              status="Upload a new file"
              onPress={() => navigation.navigate('Documents')}
            />
            <HomeQuickAction
              icon={ListChecks}
              title="Create package"
              status="Organize items"
              onPress={() => navigation.navigate('Packages')}
            />
          </View>
        </View>

        <HomeEssentialsBanner />
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
  attentionGroup: { gap: 12 },
  quickHeader: { paddingHorizontal: 4, minHeight: 16 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

});
