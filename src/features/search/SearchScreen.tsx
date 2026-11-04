import { NoSearchResults } from '../../components/feedback/NoSearchResults';
import { ErrorState } from '../../components/feedback/ErrorState';
import { searchHistoryStorage } from '../../storage/searchHistoryStorage';
import { useAppSelector } from '../../app/store/hooks';
import React from 'react';
import { Keyboard, Platform } from 'react-native';
import { ArrowLeft, Clock3, ChevronRight } from 'lucide-react-native';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { TextAction } from '../../components/primitives/TextAction';
import type { GlobalSearchResult } from '../../api/web.types';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { searchDestination } from './searchDestination';
import { useGlobalSearch } from './useGlobalSearch';
import { SearchBar } from '../../components/primitives/SearchBar';
import { LoadingState } from '../../components/feedback/LoadingState';
import { Stack, AppText } from '../shared/FeatureUI';
const Overlay = styled.View(() => ({ flex: 1 }));
const Backdrop = styled.Pressable(({ theme }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: theme.colors.overlay,
}));
const KeyboardFrame = styled.KeyboardAvoidingView.attrs({
  behavior: Platform.OS === 'ios' ? ('padding' as const) : undefined,
  pointerEvents: 'box-none' as const,
})(() => ({ flex: 1 }));
const Panel = styled.View<{ $top: number }>(({ theme, $top }) => ({
  paddingTop: $top,
  flexShrink: 1,
  maxHeight: '75%',
  width: '100%',
  alignSelf: 'center',
  backgroundColor: theme.colors.surface,
  borderBottomLeftRadius: theme.radius.panel,
  borderBottomRightRadius: theme.radius.panel,
  paddingHorizontal: theme.spacing.md,
  overflow: 'hidden',
}));
const Results = styled.ScrollView.attrs({
  keyboardShouldPersistTaps: 'handled' as const,
  keyboardDismissMode: 'interactive' as const,
})(() => ({ flexGrow: 0, flexShrink: 1 }));
const SearchTop = styled.View(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.xs,
  minHeight: theme.sizes.minimumTouchTarget,
  paddingVertical: theme.spacing.xs,
}));
const BackControl = styled.Pressable(({ theme }) => ({
  width: theme.sizes.minimumTouchTarget,
  height: theme.sizes.minimumTouchTarget,
  justifyContent: 'center',
  alignItems: 'flex-start',
}));
const HeaderTitle = styled(AppText).attrs({ variant: 'body', align: 'center' })(
  () => ({ flex: 1 }),
);
const HeaderBalance = styled.View(({ theme }) => ({
  width: theme.sizes.minimumTouchTarget,
}));
const RecentChips = styled.View(({ theme }) => ({
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: theme.spacing.sm,
}));
const RecentChip = styled.Pressable(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  maxWidth: '100%',
  gap: theme.spacing.xs,
  paddingHorizontal: theme.spacing.sm,
  paddingVertical: theme.spacing.xs + 2,
  minHeight: 36,
  borderWidth: 1,
  borderColor: theme.colors.controlBorder,
  borderRadius: theme.radius.pill,
}));
const RecentLabel = styled(AppText).attrs({ variant: 'caption' })(() => ({
  letterSpacing: 1.2,
}));
const SectionRule = styled.View(({ theme }) => ({
  flex: 1,
  height: 1,
  backgroundColor: theme.colors.border,
}));
const SectionHeader = styled.View(() => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
}));
const ResultRow = styled.Pressable(({ theme }) => ({
  minHeight: 48,
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.sm,
  paddingVertical: theme.spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: theme.colors.border,
}));
const ResultCopy = styled.View(({ theme }) => ({
  flex: 1,
  gap: theme.spacing.xs,
}));
const Content = styled(Stack)(({ theme }) => ({
  paddingVertical: theme.spacing.md,
}));

export function SearchScreen({
  route,
}: {
  route?: { params?: { query?: string } };
}) {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useAppTheme();
  const close = () => {
    Keyboard.dismiss();
    navigation.goBack();
  };
  const accountId = useAppSelector(state => state.auth.user?.id);
  const [query, setQuery] = React.useState(route?.params?.query ?? '');
  const [history, setHistory] = React.useState<string[]>([]);
  React.useEffect(() => {
    let active = true;
    if (accountId)
      void searchHistoryStorage
        .read(accountId)
        .then(value => {
          if (active) setHistory(value);
        })
        .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [accountId]);
  React.useEffect(() => {
    if (route?.params?.query !== undefined) {
      setQuery(route.params.query);
    }
  }, [route?.params?.query]);
  const submit = (value = query) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    const next = [trimmed, ...history.filter(item => item !== trimmed)].slice(
      0,
      8,
    );
    setHistory(next);
    if (accountId)
      void searchHistoryStorage.write(accountId, next).catch(() => undefined);
  };
  const [exact, setExact] = React.useState(false);
  const results = useGlobalSearch(query, accountId, exact);
  const openResult = (result: GlobalSearchResult) => {
    submit(query);
    const destination = searchDestination(result);
    close();
    switch (destination.screen) {
      case 'DocumentLibrary':
        navigation.navigate('DocumentLibrary', destination.params);
        break;
      case 'Packages':
        navigation.navigate('Packages', destination.params);
        break;
      case 'Health':
        navigation.navigate('Health', destination.params);
        break;
      case 'Wealth':
        navigation.navigate('Wealth', destination.params);
        break;
      case 'Family':
        navigation.navigate('Family', destination.params);
        break;
      case 'TrustedAccess':
        navigation.navigate('TrustedAccess', destination.params);
        break;
    }
  };
  return (
    <Overlay>
      <Backdrop
        accessibilityRole="button"
        accessibilityLabel="Close search"
        onPress={close}
      />
      <KeyboardFrame>
        <Panel $top={insets.top} accessibilityViewIsModal>
          <SearchTop>
            <BackControl
              accessibilityRole="button"
              accessibilityLabel="Back from search"
              onPress={close}
            >
              <ArrowLeft size={22} color={theme.colors.textMuted} />
            </BackControl>
            <HeaderTitle>Search your Readines</HeaderTitle>
            <HeaderBalance />
          </SearchTop>
          <SearchBar
            autoFocus
            accessibilityLabel="Search everything"
            placeholder="Search documents, packages, records…"
            autoCapitalize="none"
            autoCorrect={false}
            value={query}
            maxLength={160}
            onChangeText={value => {
              setExact(false);
              setQuery(value);
            }}
            onSubmitEditing={() => submit()}
            returnKeyType="search"
          />
          <Results>
            <Content gap="sm">
              {!query.trim() && history.length ? (
                <Stack gap="xs">
                  <SectionHeader>
                    <RecentLabel>RECENT SEARCHES</RecentLabel>
                    <SectionRule />
                    <TextAction
                      title="Clear"
                      accessibilityLabel="Clear recent searches"
                      onPress={() => {
                        setHistory([]);
                        if (accountId)
                          void searchHistoryStorage
                            .clear(accountId)
                            .catch(() => undefined);
                      }}
                    />
                  </SectionHeader>
                  <RecentChips>
                    {history.map(item => (
                      <RecentChip
                        key={item}
                        accessibilityRole="button"
                        accessibilityLabel={`Search for ${item}`}
                        onPress={() => submit(item)}
                      >
                        <Clock3 size={17} color={theme.colors.textMuted} />
                        <AppText numberOfLines={1}>{item}</AppText>
                      </RecentChip>
                    ))}
                  </RecentChips>
                </Stack>
              ) : null}
              {!query.trim() && !history.length ? (
                <AppText variant="caption" color="muted">
                  Find documents, packages and records.
                </AppText>
              ) : null}
              {results.status === 'loading' ? (
                <LoadingState compact label="Searching…" />
              ) : null}
              {results.correctedQuery ? (
                <Stack gap="xs">
                  <AppText color="secondary">
                    Searching for “{results.correctedQuery}” (spelling
                    corrected).
                  </AppText>
                  <TextAction
                    title={`Use my original search: ${query}`}
                    onPress={() => setExact(true)}
                  />
                </Stack>
              ) : null}
              {results.status === 'failed' ? (
                <ErrorState
                  issue={results.issue}
                  message={results.error}
                  onRetry={results.retry}
                  onBack={close}
                />
              ) : null}
              {results.status === 'succeeded' && !results.groups.length ? (
                <NoSearchResults
                  query={query}
                  onSearch={value => {
                    setExact(false);
                    submit(value);
                  }}
                />
              ) : null}
              {results.groups.map(group => (
                <Stack key={group.section} gap="xs">
                  <AppText variant="caption" color="muted">
                    {group.label}
                  </AppText>
                  {group.results.map(result => (
                    <ResultRow
                      key={result.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${result.title}`}
                      onPress={() => openResult(result)}
                    >
                      <ResultCopy>
                        <AppText variant="rowTitle" numberOfLines={2}>
                          {result.title}
                        </AppText>
                        {result.subtitle ? (
                          <AppText
                            variant="caption"
                            color="secondary"
                            numberOfLines={2}
                          >
                            {result.subtitle}
                          </AppText>
                        ) : null}
                      </ResultCopy>
                      <ChevronRight size={16} color={theme.colors.textMuted} />
                    </ResultRow>
                  ))}
                </Stack>
              ))}
            </Content>
          </Results>
        </Panel>
      </KeyboardFrame>
    </Overlay>
  );
}
