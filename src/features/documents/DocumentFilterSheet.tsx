import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../components/primitives/AppText';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import {
  ALL,
  defaultFilters,
  quickFilterLabels,
  sortLabels,
  type DocumentFilters,
} from './documentFilters';

type Option = { value: string; label: string; count?: number };

function Chip({ label, count, active, onPress }: { label: string; count?: number; active: boolean; onPress: () => void }) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? theme.colors.selection.surface : theme.colors.surface.default,
          borderColor: active ? theme.colors.selection.border : theme.colors.border.subtle,
        },
      ]}
    >
      <AppText variant="label" color={active ? 'heading' : 'secondary'}>
        {count === undefined ? label : `${label} · ${count}`}
      </AppText>
    </Pressable>
  );
}

function Group({ title, options, value, onSelect }: {
  title: string;
  options: Option[];
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.group}>
      <AppText variant="label" color="secondary">{title}</AppText>
      <View style={styles.chips}>
        {options.map(option => (
          <Chip
            key={option.value}
            label={option.label}
            count={option.count}
            active={value === option.value}
            onPress={() => onSelect(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

export function DocumentFilterSheet({
  visible,
  filters,
  quickCounts,
  categories,
  people,
  onChange,
  onClose,
}: {
  visible: boolean;
  filters: DocumentFilters;
  quickCounts: Record<string, number>;
  categories: string[];
  people: string[];
  onChange: (filters: DocumentFilters) => void;
  onClose: () => void;
}) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const set = <K extends keyof DocumentFilters>(key: K, value: DocumentFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close filters"
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.overlay.scrim }]}
          onPress={onClose}
        />
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface.default, paddingBottom: Math.max(16, insets.bottom + 8) }]}>
          <View style={[styles.handle, { backgroundColor: theme.colors.border.default }]} />
          <View style={styles.header}>
            <AppText variant="title">Filters</AppText>
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => onChange(defaultFilters)}>
                <AppText variant="label" color="secondary">Reset</AppText>
              </Pressable>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={onClose}>
                <AppText variant="labelMd" style={{ color: theme.colors.text.link }}>Done</AppText>
              </Pressable>
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Group
              title="Status"
              value={filters.quick}
              onSelect={value => set('quick', value as DocumentFilters['quick'])}
              options={quickFilterLabels.map(([value, label]) => ({
                value,
                label,
                count: value === 'all' || value === 'proofs' ? undefined : quickCounts[value],
              }))}
            />
            <Group
              title="Category"
              value={filters.category}
              onSelect={value => set('category', value)}
              options={[{ value: ALL, label: 'All' }, ...categories.map(name => ({ value: name, label: name }))]}
            />
            <Group
              title="Person"
              value={filters.person}
              onSelect={value => set('person', value)}
              options={[{ value: ALL, label: 'Everyone' }, ...people.map(name => ({ value: name, label: name }))]}
            />
            <Group
              title="Sort"
              value={filters.sort}
              onSelect={value => set('sort', value as DocumentFilters['sort'])}
              options={sortLabels.map(([value, label]) => ({ value, label }))}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: radius.overlay,
    borderTopRightRadius: radius.overlay,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  handle: { width: sizes.sheetHandle.width, height: sizes.sheetHandle.height, borderRadius: radius.pill, alignSelf: 'center', marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  content: { gap: 12, paddingVertical: 4 },
  group: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { minHeight: 32, paddingHorizontal: 12, justifyContent: 'center', borderWidth: 1, borderRadius: radius.pill },
});
