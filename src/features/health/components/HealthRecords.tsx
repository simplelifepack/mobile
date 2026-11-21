import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ChevronRight, FileText, Info, Plus, Search } from 'lucide-react-native';

import type { HealthRecord } from '../../../api/health.api';
import type { DocumentRecord } from '../../../api/types';
import { AppText } from '../../../components/primitives/AppText';
import { radius } from '../../../design/tokens/radius';
import { sizes } from '../../../design/tokens/sizes';
import { textRoles } from '../../../design/tokens/typography';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import { formatDate, humanizeLabel } from '../../../utils/format';

const filters = [
  { label: 'All', value: 'all' },
  { label: 'Lab reports', value: 'lab_report' },
  { label: 'Medical reports', value: 'medical_report' },
  { label: 'Prescriptions', value: 'prescription' },
] as const;
type RecordFilter = typeof filters[number]['value'];

export function HealthRecords({
  records, documents, onUpload, onPreview,
}: {
  records?: HealthRecord[];
  documents?: DocumentRecord[];
  onUpload: () => void;
  onPreview: (documentId: string) => void;
}) {
  const { theme } = useAppTheme();
  const colors = theme.colors;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<RecordFilter>('all');
  const rows = useMemo(() => {
    const docs = new Map((documents ?? []).map(document => [document.id, document]));
    const search = query.trim().toLocaleLowerCase();
    return (records ?? [])
      .map(record => {
        const document = docs.get(record.documentId);
        const title = document?.displayName?.trim() || document?.title?.trim() ||
          document?.originalName?.trim() || humanizeLabel(record.type);
        return { record, title, document };
      })
      .filter(({ record, title, document }) =>
        (filter === 'all' || record.type === filter) &&
        (!search || [
          title, document?.originalName, humanizeLabel(record.type), record.provider,
          record.doctor, humanizeLabel(record.processingStatus), formatDate(record.documentDate),
        ].some(value => value?.toLocaleLowerCase().includes(search))),
      )
      .sort((a, b) => (b.record.documentDate || b.record.createdAt)
        .localeCompare(a.record.documentDate || a.record.createdAt));
  }, [records, documents, query, filter]);

  return (
    <View style={styles.container}>
      <View style={[styles.search, { backgroundColor: colors.surface.secondary }]}>
        <Search size={sizes.icon.sm} color={colors.icon.interactive} />
        <TextInput
          accessibilityLabel="Search health records"
          placeholder="Search records"
          placeholderTextColor={colors.text.tertiary}
          value={query}
          onChangeText={setQuery}
          style={[styles.searchInput, { color: colors.text.primary }]}
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      <View style={styles.filters}>
        {filters.map(item => {
          const selected = filter === item.value;
          return (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setFilter(item.value)}
              style={[styles.filter, {
                backgroundColor: selected ? colors.action.primary.default : colors.surface.brandTint,
                borderColor: selected ? colors.action.primary.default : colors.border.default,
              }]}
            >
              <AppText variant="caption" style={{ color: selected ? colors.text.onBrand : colors.text.interactive }}>
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.heading}>
        <AppText variant="compactLabel" style={styles.grow}>Medical records</AppText>
        <Pressable accessibilityRole="button" onPress={onUpload} style={styles.upload}>
          <Plus size={sizes.icon.sm} color={colors.icon.interactive} />
          <AppText variant="caption" style={{ color: colors.text.interactive }}>Add record</AppText>
        </Pressable>
      </View>

      <View style={styles.list}>
        {records === undefined ? (
          <AppText variant="bodySm" color="secondary">Records unavailable. Pull to refresh.</AppText>
        ) : rows.length ? rows.map(({ record, title }) => (
          <Pressable
            key={record.id}
            accessibilityRole="button"
            accessibilityLabel={`View original document: ${title}`}
            onPress={() => onPreview(record.documentId)}
            style={[styles.row, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}
          >
            <View style={[styles.iconWell, { backgroundColor: colors.surface.secondary }]}>
              <FileText size={sizes.icon.md} color={colors.icon.interactive} />
            </View>
            <View style={styles.grow}>
              <AppText variant="compactLabel">{title}</AppText>
              <AppText variant="caption" style={{ color: colors.text.interactive }}>
                {[humanizeLabel(record.type), record.provider || record.doctor, formatDate(record.documentDate || record.createdAt)].filter(Boolean).join(' · ')}
              </AppText>
              {record.processingStatus ? (
                <AppText variant="caption" color="secondary">{humanizeLabel(record.processingStatus)}</AppText>
              ) : null}
            </View>
            <ChevronRight size={sizes.icon.sm} color={colors.icon.interactive} />
          </Pressable>
        )) : (
          <AppText variant="bodySm" color="secondary">
            {records.length ? 'No records match your search or filter.' : 'No health records yet. Add a medical record to get started.'}
          </AppText>
        )}
      </View>

      <View style={[styles.notice, { backgroundColor: colors.surface.secondary }]}>
        <Info size={sizes.icon.sm} color={colors.icon.interactive} />
        <AppText variant="caption" color="secondary" style={styles.grow}>
          Select a record to preview its original document.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  grow: { flex: 1, minWidth: 0 },
  search: { minHeight: 44, borderRadius: radius.control, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  searchInput: { ...textRoles.bodySm, flex: 1, paddingVertical: 8 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: { minHeight: 36, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  upload: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 },
  list: { gap: 8 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderWidth: 1, borderRadius: radius.surface },
  iconWell: { width: 32, height: 32, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: radius.control, gap: 8, padding: 12 },
});
