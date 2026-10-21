import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Search, X } from 'lucide-react-native';

import { AppText } from '../../components/primitives/AppText';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import {
  searchApi,
  type GlobalSearchGroup,
  type GlobalSearchResult,
} from '../../api/search.api';

export function GlobalSearchModal({
  visible,
  onClose,
  onOpenResult,
}: {
  visible: boolean;
  onClose: () => void;
  onOpenResult: (result: GlobalSearchResult) => void;
}) {
  const { theme } = useAppTheme();
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<GlobalSearchGroup[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'failed'>(
    'idle',
  );
  const [error, setError] = useState('');
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    const id = ++requestId.current;
    if (!trimmed) {
      setGroups([]);
      setStatus('idle');
      setError('');
      return;
    }
    const handle = setTimeout(() => {
      setStatus('loading');
      setError('');
      searchApi
        .search(trimmed)
        .then(response => {
          if (requestId.current !== id) return;
          setGroups(
            response.groups
              .map(group => ({
                ...group,
                results: group.results.filter(item => item.title.trim()),
              }))
              .filter(group => group.results.length),
          );
          setStatus('done');
        })
        .catch(caught => {
          if (requestId.current !== id) return;
          setGroups([]);
          setStatus('failed');
          setError(caught instanceof Error ? caught.message : 'Search failed.');
        });
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <View
          style={[
            styles.bar,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Search size={20} color={theme.colors.textSecondary} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search documents, packs, health, wealth…"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={[styles.input, { color: theme.colors.textPrimary }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close search"
            hitSlop={8}
            onPress={close}
          >
            <X size={20} color={theme.colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.list}>
          {status === 'loading' ? <ActivityIndicator color={theme.colors.primary} /> : null}
          {status === 'failed' ? <AppText color="danger">{error}</AppText> : null}
          {status === 'done' && !groups.length ? (
            <AppText color="secondary">No results for “{query.trim()}”.</AppText>
          ) : null}
          {groups.map(group => (
            <View key={group.section} style={styles.group}>
              <AppText variant="label" color="secondary">
                {group.label}
              </AppText>
              {group.results.map(result => (
                <Pressable
                  key={`${group.section}-${result.id}`}
                  accessibilityRole="button"
                  onPress={() => {
                    onOpenResult(result);
                    close();
                  }}
                  style={[
                    styles.result,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <AppText variant="heading" numberOfLines={1}>
                    {result.title}
                  </AppText>
                  {result.subtitle ? (
                    <AppText color="secondary" numberOfLines={1}>
                      {result.subtitle}
                    </AppText>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 56, paddingHorizontal: 16 },
  bar: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, minHeight: 48 },
  list: { paddingVertical: 16, gap: 16 },
  group: { gap: 8 },
  result: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 2 },
});
