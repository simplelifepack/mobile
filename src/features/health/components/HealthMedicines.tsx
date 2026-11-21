import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ChevronRight, FileText, Info, Plus } from 'lucide-react-native';

import type { HealthRecord, HealthTimelineEvent } from '../../../api/health.api';
import { AppText } from '../../../components/primitives/AppText';
import { radius } from '../../../design/tokens/radius';
import { sizes } from '../../../design/tokens/sizes';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import { formatDate, humanizeLabel } from '../../../utils/format';

export function HealthMedicines({
  timeline, records, updatingId, onAdd, onPreview, onToggle,
}: {
  timeline?: HealthTimelineEvent[];
  records?: HealthRecord[];
  updatingId?: string;
  onAdd: () => void;
  onPreview: (documentId: string) => void;
  onToggle: (id: string, stopped: boolean) => void;
}) {
  const { theme } = useAppTheme();
  const colors = theme.colors;
  const [filter, setFilter] = useState<'Current' | 'Past'>('Current');
  const medicines = (timeline ?? []).filter(event => event.medication);
  const current = medicines.filter(event => event.medication?.status === 'continuing');
  const past = medicines.filter(event => event.medication?.status === 'stopped');
  const other = medicines.filter(event => event.medication?.status !== 'continuing' && event.medication?.status !== 'stopped');
  const visible = filter === 'Current' ? current : past;

  const card = (event: HealthTimelineEvent) => {
    const medicine = event.medication;
    if (!medicine) return null;
    const source = records?.find(record => record.id === event.recordId);
    const instructions = humanizeLabel(medicine.mealTiming);
    const fields = [
      { label: 'Dosage', value: [medicine.dose, medicine.frequency || medicine.whenToTake?.map(humanizeLabel).join(', ')].filter(Boolean).join(' · ') },
      { label: 'Instructions', value: instructions },
      { label: 'Course', value: medicine.duration },
      { label: 'Prescribed by', value: source?.doctor },
      { label: 'Runs out', value: formatDate(medicine.runsOutAt) },
      ...(medicine.status !== 'continuing' && medicine.status !== 'stopped'
        ? [{ label: 'Status', value: humanizeLabel(medicine.status) || 'Unknown' }] : []),
    ];
    return (
      <View key={event.id} style={[styles.card, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
        <AppText variant="heading">{medicine.name}</AppText>
        <View style={styles.fields}>
          {fields.filter(field => field.value).map(field => (
            <View key={field.label} style={styles.field}>
              <AppText variant="caption" color="muted" style={styles.fieldLabel}>{field.label}</AppText>
              <AppText variant="bodySm" style={styles.grow}>{field.value}</AppText>
            </View>
          ))}
          {!fields.some(field => field.value) ? <AppText variant="caption" color="secondary">No dosage or schedule recorded.</AppText> : null}
        </View>
        {source ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`View original record for ${medicine.name}`}
            onPress={() => onPreview(source.documentId)}
            style={[styles.source, { borderColor: colors.border.default }]}>
            <FileText size={sizes.icon.md} color={colors.icon.interactive} />
            <View style={styles.grow}>
              <AppText variant="label">View original record</AppText>
              <AppText variant="caption" style={{ color: colors.text.interactive }}>Prescription or source document</AppText>
            </View>
            <ChevronRight size={sizes.icon.sm} color={colors.icon.interactive} />
          </Pressable>
        ) : null}
        {medicine.status === 'continuing' || medicine.status === 'stopped' ? (
          <Pressable accessibilityRole="button"
            accessibilityLabel={`${medicine.status === 'stopped' ? 'Resume' : 'Mark stopped'}: ${medicine.name}`}
            disabled={Boolean(updatingId)}
            accessibilityState={{ disabled: Boolean(updatingId) }}
            onPress={() => onToggle(event.id, medicine.status === 'stopped')} style={styles.statusAction}>
            <AppText variant="caption" style={{ color: colors.text.interactive }}>
              {updatingId === event.id ? 'Updating…' : medicine.status === 'stopped' ? 'Resume' : 'Mark stopped'}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        {(['Current', 'Past'] as const).map(item => (
          <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: filter === item }}
            onPress={() => setFilter(item)} style={[styles.filter, {
              backgroundColor: filter === item ? colors.action.primary.default : colors.surface.brandTint,
              borderColor: filter === item ? colors.action.primary.default : colors.border.default,
            }]}>
            <AppText variant="caption" style={{ color: filter === item ? colors.text.onBrand : colors.text.interactive }}>
              {item}{timeline ? ` · ${item === 'Current' ? current.length : past.length}` : ''}
            </AppText>
          </Pressable>
        ))}
      </View>
      <AppText variant="compactLabel">{filter} medicines</AppText>
      {timeline === undefined ? (
        <AppText variant="bodySm" color="secondary">Medicines unavailable. Pull to refresh.</AppText>
      ) : visible.length ? visible.map(card) : (
        <AppText variant="bodySm" color="secondary">{`No ${filter.toLowerCase()} medicines.`}</AppText>
      )}
      {other.length ? (
        <>
          <AppText variant="compactLabel">Other medicines</AppText>
          {other.map(card)}
        </>
      ) : null}
      <View style={[styles.notice, { backgroundColor: colors.surface.secondary }]}>
        <Info size={sizes.icon.sm} color={colors.icon.secondary} />
        <AppText variant="caption" color="secondary" style={styles.grow}>
          Follow your doctor’s instructions; ReadiNes does not recommend medicines or change doses.
        </AppText>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Add medicine" onPress={onAdd}
        style={[styles.add, { backgroundColor: colors.action.primary.default }]}>
        <AppText variant="label" color="onPrimary">Add</AppText>
        <Plus size={sizes.icon.sm} color={colors.text.onBrand} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  grow: { flex: 1, minWidth: 0 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: { minHeight: 36, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 12 },
  card: { borderWidth: 1, borderRadius: radius.surface, padding: 16, gap: 12 },
  fields: { gap: 8 },
  field: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  fieldLabel: { width: '35%' },
  source: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderWidth: 1, borderRadius: radius.control },
  statusAction: { minHeight: 44, justifyContent: 'center', alignItems: 'flex-start' },
  notice: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: radius.control, gap: 8, padding: 12 },
  add: { minHeight: 44, borderRadius: radius.control, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
