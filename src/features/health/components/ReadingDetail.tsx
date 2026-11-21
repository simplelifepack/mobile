import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Activity, ChevronRight, Plus } from 'lucide-react-native';

import type { HealthMeasurement } from '../../../api/health.api';
import { AppText } from '../../../components/primitives/AppText';
import { radius } from '../../../design/tokens/radius';
import { sizes } from '../../../design/tokens/sizes';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import { formatDate } from '../../../utils/format';
import type { ReadingView } from '../healthTypes';
import { TrendChart } from './ReadingViews';

const periods = ['All', 'This week', 'This month'] as const;
type Period = typeof periods[number];

export function filterReadingHistory(measurements: HealthMeasurement[], period: Period, now = new Date()) {
  if (period === 'All') return measurements;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'This week') start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  else start.setDate(1);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return measurements.filter(item => {
    const time = item.measuredAt ? Date.parse(item.measuredAt) : NaN;
    return Number.isFinite(time) && time >= start.getTime() && time < end.getTime();
  });
}

function valueText(measurement: HealthMeasurement) {
  return `${measurement.value}${measurement.secondaryValue != null ? `/${measurement.secondaryValue}` : ''} ${measurement.unit}`.trim();
}

export function ReadingDetail({ reading, onPreview, onAddReading }: {
  reading: ReadingView;
  onPreview: (documentId: string) => void;
  onAddReading: () => void;
}) {
  const { theme } = useAppTheme();
  const colors = theme.colors;
  const [period, setPeriod] = useState<Period>('All');
  const history = filterReadingHistory(reading.measurements, period);
  const panel = { backgroundColor: colors.surface.default, borderColor: colors.border.default };
  const units = new Set(history.map(item => item.unit.trim().toLowerCase()));
  const compatible = units.size <= 1;

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        {periods.map(item => {
          const selected = item === period;
          return (
            <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected }}
              onPress={() => setPeriod(item)}
              style={[styles.filter, { backgroundColor: selected ? colors.action.primary.default : colors.surface.brandTint, borderColor: selected ? colors.action.primary.default : colors.border.default }]}>
              <AppText variant="caption" style={{ color: selected ? colors.text.onBrand : colors.text.interactive }}>{item}</AppText>
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.chartCard, panel]}>
        <AppText variant="caption" color="secondary">Latest recorded value</AppText>
        <AppText variant="display">{reading.value} <AppText variant="body" color="secondary">{reading.unit}</AppText></AppText>
        <AppText variant="caption" color="secondary">
          {formatDate(reading.measuredAt) || 'Date not recorded'} · {reading.status}
        </AppText>
        <AppText variant="caption" color="secondary">
          {reading.range ? `Range on report: ${reading.range}` : 'No range printed on the report'}
        </AppText>
        {history.length && compatible ? <TrendChart measurements={history} tone={reading.color} /> : (
          <AppText variant="bodySm" color="secondary">
            {history.length ? 'Trend unavailable because readings use different units.' : 'No dated readings in this period.'}
          </AppText>
        )}
      </View>

      <View style={styles.heading}>
        <AppText variant="compactLabel" style={styles.grow}>Reading history</AppText>
        <AppText variant="caption" color="secondary">{history.length} {history.length === 1 ? 'entry' : 'entries'}</AppText>
      </View>
      <View style={styles.list}>
        {history.map(item => {
          const content = (
            <>
              <View style={[styles.iconWell, { backgroundColor: colors.surface.secondary }]}><Activity size={sizes.icon.md} color={colors.icon.interactive} /></View>
              <View style={styles.grow}>
                <AppText variant="compactLabel">{valueText(item)}</AppText>
                <AppText variant="caption" style={{ color: colors.text.interactive }}>
                  {formatDate(item.measuredAt) || 'Date not recorded'} · {item.sourceDocumentId ? 'Document' : 'Manual or other source'}
                </AppText>
                <AppText variant="caption" color="secondary">{item.originalName}</AppText>
              </View>
              {item.sourceDocumentId ? <ChevronRight size={sizes.icon.sm} color={colors.icon.interactive} /> : null}
            </>
          );
          const rowStyle = [styles.row, panel];
          return item.sourceDocumentId ? (
            <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`View source document for ${valueText(item)}`}
              onPress={() => onPreview(item.sourceDocumentId!)} style={rowStyle}>{content}</Pressable>
          ) : <View key={item.id} style={rowStyle}>{content}</View>;
        })}
        {!history.length ? <AppText variant="bodySm" color="secondary">No readings in this period.</AppText> : null}
      </View>
      <Pressable accessibilityRole="button" onPress={onAddReading} style={[styles.add, { backgroundColor: colors.action.primary.default }]}>
        <Plus size={sizes.icon.sm} color={colors.text.onBrand} />
        <AppText variant="label" color="onPrimary">Log a reading</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  grow: { flex: 1, minWidth: 0 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: { minHeight: 36, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 12 },
  chartCard: { borderWidth: 1, borderRadius: radius.surface, padding: 12, gap: 8 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  list: { gap: 8 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderWidth: 1, borderRadius: radius.surface },
  iconWell: { width: 32, height: 32, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  add: { minHeight: 44, borderRadius: radius.control, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
