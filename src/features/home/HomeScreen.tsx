import React from 'react';
import { networkSnapshot, useConnectivity } from '../../network/connectivity';
import { StatusBar, type ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  FileText,
  Package,
  Heart,
  TrendingUp,
  CircleAlert,
  ChevronRight,
  ArrowRight,
  Check,
} from 'lucide-react-native';
import type { RootStackParamList } from '../../app/navigation/types';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { useAppSelector } from '../../app/store/hooks';
import { useBootstrapQuery } from '../../services/api';
import { mobileApi } from '../../api/mobile.api';
import { packagesApi } from '../../api/packages.api';
import { useResource } from '../shared/FeatureUI';
import { dueTiming, packageOverview } from './homeOverview';
import * as S from './styles';
import { HomeDataState } from './HomeDataState';
import { HomeRecovery } from './HomeRecovery';
import { AppHeader } from '../../components/navigation/AppHeader';
async function loadHomePackages(signal: AbortSignal) {
  const first = await packagesApi.list({ limit: 200 }, false, signal);
  const items = [...first.items];
  let page = first;
  while (page.pagination.hasNextPage) {
    page = await packagesApi.list(
      {
        limit: 200,
        page: page.pagination.page + 1,
      },
      false,
      signal,
    );
    items.push(...page.items);
  }
  return items;
}
export function HomeScreen({
  onInitialReady,
}: { onInitialReady?: () => void } = {}) {
  const notifiedReady = React.useRef(false);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useAppTheme();
  const colors = theme.dashboard;
  const connection = useConnectivity();
  const offline = connection.offline || connection.unreachable;
  const user = useAppSelector(state => state.auth.user);
  const bootstrap = useBootstrapQuery();
  const attention = useResource(mobileApi.health.homeAttention);
  const wealth = useResource(mobileApi.wealth.records);
  const packages = useResource(loadHomePackages);
  const scroll = React.useRef<React.ComponentRef<typeof ScrollView>>(null);
  const attentionOffset = React.useRef(0);
  const [expanded, setExpanded] = React.useState(false);
  const refreshAttention = attention.revalidate;
  const refreshWealth = wealth.revalidate;
  const refreshPackages = packages.revalidate;
  const firstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      if (networkSnapshot().offline) return;
      refreshAttention();
      refreshWealth();
      refreshPackages();
    }, [refreshAttention, refreshWealth, refreshPackages]),
  );
  const documents = React.useMemo(
    () => bootstrap.data?.documents ?? [],
    [bootstrap.data?.documents],
  );
  const now = Date.now();
  const expiring = documents.filter(
    document =>
      document.expiryDate &&
      Date.parse(document.expiryDate) <= now + 60 * 86400000,
  );
  const getWealthDate = (record: NonNullable<typeof wealth.data>[number]) =>
    record.followUpDate ??
    (['renewalDate', 'maturityDate', 'dueDate', 'policyEndDate']
      .map(key => record.details[key])
      .find(value => typeof value === 'string') as string | undefined);
  const wealthDue = (wealth.data ?? []).filter(record => {
    const date = getWealthDate(record);
    return (
      date &&
      Date.parse(date) < now + 60 * 86400000 &&
      record.details.followUpDone !== true
    );
  });
  const attentionItems = [
    ...expiring.map(document => ({
      id: `document-${document.id}`,
      Icon: FileText,
      title: document.displayName || document.originalName,
      ...dueTiming(document.expiryDate),
      onPress: () =>
        navigation.navigate('DocumentLibrary', { documentId: document.id }),
    })),
    ...(attention.data?.reminders ?? []).map(item => ({
      id: `reminder-${item.id}`,
      Icon: FileText,
      title: `${item.memberName} · ${item.title}`,
      ...dueTiming(item.dueDate),
      onPress: () => navigation.navigate('Health', { memberId: item.memberId }),
    })),
    ...(attention.data?.medications ?? []).map(item => ({
      id: `medication-${item.id}`,
      Icon: Heart,
      title: `${item.memberName} · ${item.title} refill`,
      ...dueTiming(item.occurredAt),
      onPress: () =>
        navigation.navigate('Health', {
          memberId: item.memberId,
          tab: 'Medications',
        }),
    })),
    ...wealthDue.map(item => ({
      id: `wealth-${item.id}`,
      Icon: TrendingUp,
      title: item.title,
      ...dueTiming(getWealthDate(item)),
      onPress: () => navigation.navigate('Wealth', { recordId: item.id }),
    })),
  ].sort((a, b) => a.order - b.order);
  const overdue = attentionItems.filter(item => item.overdue).length;
  const loadingOverview =
    bootstrap.isLoading ||
    (attention.loading && !attention.data) ||
    (wealth.loading && !wealth.data) ||
    (packages.loading && !packages.data);
  const incompleteOverview = Boolean(
    bootstrap.error || attention.error || wealth.error || packages.error,
  );
  React.useEffect(() => {
    if (
      !notifiedReady.current &&
      (!loadingOverview || incompleteOverview || offline)
    ) {
      notifiedReady.current = true;
      onInitialReady?.();
    }
  }, [loadingOverview, incompleteOverview, offline, onInitialReady]);
  const packStats = React.useMemo(
    () => packageOverview(packages.data ?? [], documents),
    [packages.data, documents],
  );
  const healthCount =
    (attention.data?.reminders.length ?? 0) +
    (attention.data?.medications.length ?? 0);
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const showAttention = () => setExpanded(value => !value);
  const focusAttention = () => {
    setExpanded(true);
    scroll.current?.scrollTo({ y: attentionOffset.current, animated: true });
  };
  const unavailable = (
    loading: boolean,
    error: unknown,
    value: string | number,
  ) => (loading ? '…' : error ? '—' : value);
  const stats: Array<{
    label: string;
    value: string | number;
    detail: string;
    badge: number;
    tone: S.Tone;
    Icon: typeof FileText;
    iconColor: string;
    onPress: () => void;
    progress?: number;
  }> = [
    {
      label: 'Documents',
      value: unavailable(
        bootstrap.isLoading && !bootstrap.data,
        bootstrap.data ? undefined : bootstrap.error,
        documents.length,
      ),
      detail: `${expiring.length} expiring soon`,
      badge: expiring.length,
      tone: expiring.length ? 'danger' : 'info',
      Icon: FileText,
      iconColor: colors.accent,
      onPress: () => navigation.navigate('DocumentLibrary'),
    },
    {
      label: 'Packages',
      value: unavailable(
        packages.loading && !packages.data,
        packages.data ? undefined : packages.error,
        `${packStats.ready}/${packStats.total}`,
      ),
      detail: `${packStats.percent}% ready`,
      badge: 0,
      tone: packStats.percent === 100 ? 'success' : 'accent',
      Icon: Package,
      iconColor: colors.accent,
      onPress: () => navigation.navigate('Packages'),
      progress: packStats.percent,
    },
    {
      label: 'Health',
      value: unavailable(
        attention.loading && !attention.data,
        attention.data ? undefined : attention.error,
        healthCount,
      ),
      detail: healthCount === 1 ? 'task pending' : 'tasks pending',
      badge: healthCount,
      tone: healthCount ? 'warning' : 'info',
      Icon: Heart,
      iconColor: colors.health,
      onPress: () => navigation.navigate('Health'),
    },
    {
      label: 'Wealth',
      value: unavailable(
        wealth.loading && !wealth.data,
        wealth.data ? undefined : wealth.error,
        wealthDue.length,
      ),
      detail: wealthDue.length === 1 ? 'follow-up due' : 'follow-ups due',
      badge: wealthDue.length,
      tone: 'info',
      Icon: TrendingUp,
      iconColor: colors.warning,
      onPress: () => navigation.navigate('Wealth'),
    },
  ];
  return (
    <S.HomeSafe>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <S.HomeScroll ref={scroll}>
        <S.HomeContent>
          <AppHeader
            embedded
            title={`${greeting}, ${user?.name?.trim().split(' ')[0] || 'there'}`}
            subtitle="Here's your Readines overview"
          />
          <HomeDataState
            loading={loadingOverview && !incompleteOverview && !offline}
            refreshing={
              bootstrap.isFetching ||
              attention.loading ||
              wealth.loading ||
              packages.loading
            }
          >
            <S.Panel
              onLayout={event => {
                attentionOffset.current = event.nativeEvent.layout.y;
              }}
            >
              <S.PanelHeader
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={showAttention}
              >
                <S.ListCopy>
                  <S.Label>Needs attention</S.Label>
                </S.ListCopy>
                <S.PanelCount>
                  <S.PanelCountText>{attentionItems.length}</S.PanelCountText>
                </S.PanelCount>
                <ChevronRight size={18} color={colors.subtle} />
              </S.PanelHeader>
              {attentionItems
                .slice(0, expanded ? undefined : 3)
                .map(
                  ({ id, Icon, title, label, overdue: isOverdue, onPress }) => (
                    <S.TaskRow
                      key={id}
                      accessibilityRole="button"
                      onPress={onPress}
                    >
                      <S.IconBadge $soft>
                        <Icon size={20} color={colors.accent} />
                      </S.IconBadge>
                      <S.TaskCopy>
                        <S.Label>{title}</S.Label>
                        {isOverdue ? (
                          <S.ToneText $tone="danger" variant="caption">
                            {label}
                          </S.ToneText>
                        ) : (
                          <S.Copy variant="caption">{label}</S.Copy>
                        )}
                      </S.TaskCopy>
                    </S.TaskRow>
                  ),
                )}
              {!attentionItems.length ? (
                <S.TaskRow>
                  <S.Copy>
                    {offline
                      ? 'No tasks were due in your last loaded overview. Reconnect to check for changes.'
                      : incompleteOverview
                        ? 'Some sections could not be refreshed. Retry below to check for tasks.'
                        : 'No tasks need your attention.'}
                  </S.Copy>
                </S.TaskRow>
              ) : attentionItems.length > 3 ? (
                <S.ShowAll accessibilityRole="button" onPress={showAttention}>
                  <S.ToneText $tone="accent">
                    {expanded
                      ? 'Show less'
                      : `Show all ${attentionItems.length}`}
                  </S.ToneText>
                </S.ShowAll>
              ) : null}
            </S.Panel>
            <S.MetricGrid>
              {stats.map(
                ({
                  label,
                  value,
                  detail,
                  badge,
                  tone,
                  Icon,
                  iconColor,
                  onPress,
                  progress,
                }) => (
                  <S.MetricTile
                    key={label}
                    accessibilityRole="button"
                    accessibilityLabel={`${label}, ${value}, ${detail}`}
                    onPress={onPress}
                  >
                    <S.TileTop>
                      <S.IconBadge>
                        <Icon size={20} color={iconColor} />
                      </S.IconBadge>
                      {badge ? (
                        <S.CountBadge $tone={tone}>
                          <S.ToneText $tone={tone} variant="caption">
                            {badge}
                          </S.ToneText>
                        </S.CountBadge>
                      ) : label === 'Packages' && packStats.total > 0 ? (
                        <S.CountBadge
                          $tone={
                            packStats.percent === 100 ? 'success' : 'accent'
                          }
                        >
                          {packStats.percent === 100 ? (
                            <Check size={13} color={colors.success} />
                          ) : (
                            <S.ToneText $tone="accent" variant="caption">
                              {packStats.percent}%
                            </S.ToneText>
                          )}
                        </S.CountBadge>
                      ) : null}
                    </S.TileTop>
                    <S.MetricCopy>
                      <S.Copy variant="caption">{label}</S.Copy>
                      <S.Value>{value}</S.Value>
                      <S.ToneText $tone={tone} variant="caption">
                        {detail}
                      </S.ToneText>
                    </S.MetricCopy>
                    {progress !== undefined ? (
                      <S.ProgressTrack
                        accessibilityRole="progressbar"
                        accessibilityLabel="Packages ready"
                        accessibilityValue={{ min: 0, max: 100, now: progress }}
                      >
                        <S.ProgressFill $value={progress} />
                      </S.ProgressTrack>
                    ) : (
                      <S.LinkRow>
                        <S.ToneText $tone="accent" variant="caption">
                          View all
                        </S.ToneText>
                        <ArrowRight size={15} color={colors.accent} />
                      </S.LinkRow>
                    )}
                  </S.MetricTile>
                ),
              )}
            </S.MetricGrid>
            <S.Banner
              accessibilityRole="button"
              accessibilityLabel={
                attentionItems.length
                  ? `View ${attentionItems.length} ${attentionItems.length === 1 ? 'item' : 'items'} needing attention`
                  : 'View account overview'
              }
              onPress={focusAttention}
            >
              <S.IconBadge $solid>
                <CircleAlert size={20} color={colors.onAccent} />
              </S.IconBadge>
              <S.ListCopy>
                <S.Label>
                  {offline
                    ? 'Your last loaded overview'
                    : loadingOverview
                      ? 'Checking your overview…'
                      : incompleteOverview
                        ? 'Some account data could not be refreshed'
                        : attentionItems.length
                          ? `${attentionItems.length} ${attentionItems.length === 1 ? 'item needs' : 'items need'} your attention`
                          : 'You’re all caught up'}
                </S.Label>
                <S.ToneText $tone="accent" variant="caption">
                  {overdue ? `${overdue} overdue · ` : ''}
                  {offline
                    ? 'Reconnect to check for new tasks'
                    : loadingOverview || incompleteOverview
                      ? 'See account status below'
                      : attentionItems.length
                        ? 'View all'
                        : 'Nothing needs attention today'}
                </S.ToneText>
              </S.ListCopy>
              <ChevronRight size={20} color={colors.accent} />
            </S.Banner>
            <HomeRecovery
              sections={[
                {
                  label: 'Documents and account',
                  error: bootstrap.error,
                  loading: bootstrap.isFetching,
                  retry: bootstrap.refetch,
                },
                {
                  label: 'Health',
                  error: attention.error,
                  issue: attention.issue,
                  loading: attention.loading,
                  retry: attention.revalidate,
                },
                {
                  label: 'Wealth',
                  error: wealth.error,
                  issue: wealth.issue,
                  loading: wealth.loading,
                  retry: wealth.revalidate,
                },
                {
                  label: 'Packages',
                  error: packages.error,
                  loading: packages.loading,
                  retry: packages.revalidate,
                },
              ]}
            />
          </HomeDataState>
        </S.HomeContent>
      </S.HomeScroll>
    </S.HomeSafe>
  );
}
