import React, { useEffect, useMemo, useState } from 'react';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import Svg, {
  Circle,
} from 'react-native-svg';

import {
  ChevronRight,
  HeartPulse,
  Plus,
  Search,
} from 'lucide-react-native';

import { useBootstrapQuery, usePackagesQuery } from '../../services/api';
import { healthApi, type HealthHomeReminder } from '../../api/health.api';
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


// ============================================================================
// Types
// ============================================================================

type NeedsYouItem = {
  id: string;
  person?: string;
  title: string;
  due: string;
  overdue?: boolean;
};


// ============================================================================
// Readiness Ring
// ============================================================================

function ReadinessRing({
  ready,
  total,
}: {
  ready: number;
  total: number;
}) {
  const { theme } = useAppTheme();

  const size = 64;
  const strokeWidth = 6;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const value = total ? Math.round((ready / total) * 100) : 0;

  const offset = circumference - (circumference * value) / 100;

  return (
    <View
      style={[
        styles.readinessRing,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <Svg
        width={size}
        height={size}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.surfaceElevated}
          strokeWidth={strokeWidth}
          fill="none"
        />

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.warning}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={styles.readinessRingCenter}>
        <AppText
          variant="heading"
          align="center"
          style={styles.readinessNumber}
        >
          {ready}
        </AppText>
      </View>
    </View>
  );
}


// ============================================================================
// Needs You Item
// ============================================================================

function NeedsYouItem({
  item,
  isLast,
  onPress,
}: {
  item: NeedsYouItem;
  isLast: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.person ?? ''} ${item.title}`}
      style={({ pressed }) => [
        styles.needsYouItem,
        {
          borderBottomColor: theme.colors.border,
          borderBottomWidth: isLast ? 0 : 1,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <Row
        align="center"
        gap="md"
        style={styles.needsYouRow}
      >
        {/* Health icon */}
        <View
          style={[
            styles.needsYouIcon,
            {
              backgroundColor:
                theme.colors.surfaceElevated,
            },
          ]}
        >
          <HeartPulse
            size={23}
            color={theme.colors.danger}
            strokeWidth={2}
          />
        </View>

        <View style={styles.needsYouContent}>
          {item.person ? (
            <AppText
              variant="label"
              numberOfLines={1}
              style={styles.personName}
            >
              {item.person}
            </AppText>
          ) : null}
          <AppText
            variant="body"
            numberOfLines={2}
            style={styles.needsYouTitle}
          >
            {item.title}
          </AppText>

          <AppText
            variant="body"
            color={
              item.overdue
                ? 'danger'
                : 'secondary'
            }
            style={styles.needsYouDue}
          >
            {item.due}
          </AppText>
        </View>

        <ChevronRight
          size={18}
          color={theme.colors.textMuted}
          strokeWidth={2}
        />
      </Row>
    </Pressable>
  );
}


// ============================================================================
// Home Screen
// ============================================================================

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
        <Stack
          align="center"
          style={{
            paddingVertical:
              theme.spacing.xl,
          }}
        >
          <LoadingState
            label="Loading your readiness overview…"
          />
        </Stack>
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
  const firstName = homeOverview.name.trim().split(/\s+/)[0] || 'there';

  const needsYouItems: NeedsYouItem[] = healthReminders.map(reminder => {
    const dueTimestamp = reminder.dueDate ? Date.parse(reminder.dueDate) : Number.NaN;
    const daysUntilDue = Number.isNaN(dueTimestamp)
      ? undefined
      : Math.ceil((dueTimestamp - Date.now()) / 86_400_000);
    const overdue = daysUntilDue !== undefined && daysUntilDue < 0;

    return {
      id: reminder.id,
      person: reminder.memberName,
      title: reminder.title,
      due: daysUntilDue === undefined
        ? 'Date not set'
        : overdue
          ? `${Math.abs(daysUntilDue)} ${Math.abs(daysUntilDue) === 1 ? 'day' : 'days'} overdue`
          : daysUntilDue === 0
            ? 'Due today'
            : `In ${daysUntilDue} days`,
      overdue,
    };
  });

  // --------------------------------------------------------------------------
  // Readiness
  // --------------------------------------------------------------------------

  // --------------------------------------------------------------------------
  // Screen
  // --------------------------------------------------------------------------

  return (
    <Screen scroll padded={false}>
        <GlobalSearchModal
          visible={searchOpen}
          onClose={() => setSearchOpen(false)}
          onOpenResult={openSearchResult}
        />
        <Stack
          gap="md"
          style={styles.container}
        >

          {/* ================================================================
              HEADER
          ================================================================ */}

          <Row
            align="center"
            justify="space-between"
          >
            <Row align="center" gap="sm">
              <BrandMark size={26} color={theme.colors.textPrimary} />
              <AppText variant="heading">Readiness</AppText>
            </Row>

            {/* Existing actions */}
            <Row gap="sm">
              <Pressable
                onPress={() => setSearchOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Search"
                style={[
                  styles.headerButton,
                  {
                    borderColor:
                      theme.colors.border,
                    backgroundColor:
                      theme.colors.surface,
                  },
                ]}
              >
                <Search
                  size={22}
                  color={
                    theme.colors.textSecondary
                  }
                  strokeWidth={2}
                />
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('Profile')}
                accessibilityRole="button"
                accessibilityLabel="Profile"
                style={[
                  styles.avatar,
                  {
                    borderColor:
                      theme.colors.border,
                    backgroundColor:
                      theme.colors.surfaceElevated,
                  },
                ]}
              >
                <AppText
                  variant="heading"
                  color="secondary"
                  align="center"
                >
                  {homeOverview.name
                    .charAt(0)
                    .toUpperCase()}
                </AppText>
              </Pressable>
            </Row>
          </Row>


          {/* ================================================================
              GREETING
          ================================================================ */}

          <Stack
            gap="xs"
            style={styles.greetingContainer}
          >
            <AppText
              variant="title"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
              style={styles.greeting}
            >
              Good morning, {firstName}
            </AppText>

            <AppText
              variant="body"
              color="secondary"
              style={styles.greetingSubtitle}
            >
              Small steps today. A more ready tomorrow.
            </AppText>
          </Stack>


          {/* ================================================================
              NEEDS YOU
          ================================================================ */}

          <View
            style={[
              styles.needsYouCard,
              {
                backgroundColor:
                  theme.colors.surface,
                borderColor:
                  theme.colors.border,
                borderRadius:
                  theme.radius.lg,
              },
            ]}
          >
            {/* Header */}

            <View style={styles.needsYouHeader}>
              <AppText
                variant="heading"
                style={styles.needsYouHeaderTitle}
              >
                Needs you
              </AppText>

              <AppText
                variant="heading"
                color="secondary"
                style={styles.needsYouCount}
              >
                {needsYouItems.length}
              </AppText>
            </View>

            {reminderError ? (
              <AppText variant="caption" color="secondary" style={styles.emptyReminders}>
                Reminders are temporarily unavailable.
              </AppText>
            ) : null}

            {/* Items */}

            {needsYouItems.length ? needsYouItems.map(
              (item, index) => (
                <NeedsYouItem
                  key={item.id}
                  item={item}
                  isLast={
                    index ===
                    needsYouItems.length - 1
                  }
                  onPress={() => navigation.navigate('Health')}
                />
              ),
            ) : !reminderError ? (
              <AppText variant="body" color="secondary" style={styles.emptyReminders}>
                Nothing needs your attention right now.
              </AppText>
            ) : null}


            {/* Show all */}
            {needsYouItems.length ? (
              <Pressable
                onPress={() => navigation.navigate('Health')}
                accessibilityRole="button"
                accessibilityLabel={`Show all ${needsYouItems.length} items`}
                style={({ pressed }) => [
                  styles.showAllButton,
                  {
                    borderTopColor: theme.colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <AppText
                  variant="heading"
                  style={[styles.showAllText, { color: theme.colors.primary }]}
                >
                  Show all {needsYouItems.length}
                </AppText>
              </Pressable>
            ) : null}
          </View>


          {/* ================================================================
              READINESS
          ================================================================ */}

          <Pressable
            onPress={() => navigation.navigate('Packages')}
            accessibilityRole="button"
            accessibilityLabel="Readiness"
            style={({ pressed }) => [
              styles.readinessCard,
              {
                borderColor:
                  theme.colors.border,
                backgroundColor:
                  theme.colors.background,
                borderRadius:
                  theme.radius.lg,
                opacity: pressed ? 0.82 : 1,
              },
            ]}
          >
            <Row
              align="center"
              gap="md"
            >
              <ReadinessRing
                ready={situationStats.ready}
                total={situationStats.total}
              />

              <View
                style={styles.readinessCopy}
              >
                <AppText variant="label" color="primary">
                  Readiness
                </AppText>
                <AppText
                  variant="body"
                  color="secondary"
                  numberOfLines={2}
                  style={styles.readinessDescription}
                >
                  {situationStats.ready} of {situationStats.total} situations ready
                </AppText>
              </View>

              <ChevronRight
                size={26}
                color={
                  theme.colors.textMuted
                }
                strokeWidth={2}
              />
            </Row>
          </Pressable>


          {/* ================================================================
              ADD RECORD
          ================================================================ */}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a record or document"
            onPress={() => navigation.navigate('Documents')}
            style={({ pressed }) => [
              styles.addRecordButton,
              {
                backgroundColor: theme.colors.primary,
                opacity: pressed ? 0.84 : 1,
              },
            ]}
          >
            <Plus
              size={20}
              color={theme.colors.onPrimary}
              strokeWidth={2.5}
            />

            <AppText
              variant="heading"
              style={[styles.addRecordLabel, { color: theme.colors.onPrimary }]}
            >
              Add a record or document
            </AppText>
          </Pressable>

        </Stack>
    </Screen>
  );
}


// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({

  container: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },


  // --------------------------------------------------------------------------
  // Header
  // --------------------------------------------------------------------------

  logo: {
    letterSpacing: 0,
  },

  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },


  // --------------------------------------------------------------------------
  // Greeting
  // --------------------------------------------------------------------------

  greetingContainer: {
    marginTop: 2,
    marginBottom: 4,
  },

  greeting: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0,
  },

  greetingSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },


  // --------------------------------------------------------------------------
  // Needs You
  // --------------------------------------------------------------------------

  needsYouCard: {
    overflow: 'hidden',
    borderWidth: 1,
  },

  needsYouHeader: {
    minHeight: 52,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  needsYouHeaderTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },

  needsYouCount: {
    fontSize: 17,
    lineHeight: 22,
  },

  needsYouItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  needsYouRow: {
    minHeight: 52,
  },

  needsYouIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  needsYouContent: {
    flex: 1,
    minWidth: 0,
  },

  needsYouTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
  },

  personName: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },

  needsYouDue: {
    marginTop: 2,
    fontSize: 15,
    lineHeight: 20,
  },

  showAllButton: {
    minHeight: 48,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  showAllText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },


  // --------------------------------------------------------------------------
  // Readiness
  // --------------------------------------------------------------------------

  readinessCard: {
    minHeight: 86,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },

  readinessRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  readinessRingCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  readinessNumber: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },

  readinessCopy: {
    flex: 1,
    minWidth: 0,
  },

  readinessDescription: {
    fontSize: 15,
    lineHeight: 22,
  },


  // --------------------------------------------------------------------------
  // Add record
  // --------------------------------------------------------------------------

  addRecordButton: {
    minHeight: 58,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 2,
    marginBottom: 8,
  },

  addRecordPlus: {
    fontSize: 24,
    lineHeight: 28,
  },

  addRecordLabel: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },


  emptyReminders: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    lineHeight: 20,
  },


  // --------------------------------------------------------------------------
  // Error
  // --------------------------------------------------------------------------

  retryButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});