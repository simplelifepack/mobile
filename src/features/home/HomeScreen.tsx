import React, { useEffect, useMemo, useState } from 'react';
import { ProfileAvatarButton } from '../../components/navigation/ProfileAvatarButton';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AlertCircle,
  Folder,
  FileText,
  HeartPulse,
  ListChecks,
  Plus,
  Search,
  WalletCards,
  ChevronRight,
} from 'lucide-react-native';

import { useBootstrapQuery, usePackagesQuery } from '../../services/api';
import { healthApi, type HealthHomeReminder } from '../../api/health.api';
import { wealthApi, type WealthRecord } from '../../api/wealth.api';
import type { DocumentRecord } from '../../api/types';
import { readinessTone } from '../readiness/readinessTone';
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
import { BrandLogo } from '../../components/BrandLogo';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
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
            <ProfileAvatarButton />
          </Row>
        </Row>

        <View style={styles.grid}>
          <Tile
            icon={Folder}
            title="Documents"
            status={
              expiringDocuments.length
                ? `${expiringDocuments.length} expiring soon`
                : documents.length
                  ? `${documents.length} stored`
                  : 'None added yet'
            }
            statusTone={expiredDocuments.length ? 'danger' : expiringDocuments.length ? 'warning' : 'neutral'}
            onPress={() => navigation.navigate('Documents')}
          />
          <Tile
            icon={ListChecks}
            title="Packages"
            status={`${situationStats.ready} of ${situationStats.total} ready`}
            statusTone={situationStats.total ? readinessTone(readyPercent) : 'neutral'}
            onPress={() => navigation.navigate('Packages')}
          />
          <Tile
            icon={HeartPulse}
            title="Health"
            status={
              overdueReminders.length
                ? `${overdueReminders.length} overdue`
                : healthReminders.length
                  ? `${healthReminders.length} tasks pending`
                  : 'All caught up'
            }
            statusTone={overdueReminders.length ? 'danger' : healthReminders.length ? 'warning' : 'neutral'}
            onPress={() => navigation.navigate('Health')}
          />
          <Tile
            icon={WalletCards}
            title="Wealth"
            status={renewalsDue.length ? `${renewalsDue.length} renewals due` : 'No renewals due'}
            statusTone={renewalsDue.length ? 'info' : 'neutral'}
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
  headerButton: { width: 44, height: 44, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  retryButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },

  section: { gap: 8 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

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
});
