import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Activity, ChevronRight, Info, Plus } from 'lucide-react-native';

import { AppText } from '../../../components/primitives/AppText';
import { radius } from '../../../design/tokens/radius';
import { sizes } from '../../../design/tokens/sizes';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import { formatDate } from '../../../utils/format';
import type { ReadingView } from '../healthTypes';
import { filterReadingsByPeriod, type ReadingPeriod } from '../readingData';

const filters: ReadingPeriod[] = ['All', 'This week', 'This month'];

export function HealthReadings({
  readings, loading, error, onRetry, onChooseTests, onAddReading, onSelectReading, readiness, visible = true, scope,
}: {
  readings: ReadingView[];
  loading: boolean;
  error?: string;
  onRetry: () => void;
  onChooseTests: () => void;
  onAddReading: () => void;
  onSelectReading: (id: string) => void;
  readiness: React.ReactNode;
  visible?: boolean;
  scope?: { total: number; showingAll: boolean; onToggle: () => void };
}) {
  const { theme } = useAppTheme();
  const colors = theme.colors;
  const [filter, setFilter] = useState<ReadingPeriod>('All');
  const [showReadiness, setShowReadiness] = useState(false);
  const filteredReadings = filterReadingsByPeriod(readings, filter);

  return (
    <View style={[styles.container, !visible && styles.hidden]}>
      <View style={styles.filters}>
        {filters.map(item => {
          const selected = filter === item;
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setFilter(item)}
              style={[styles.filter, {
                backgroundColor: selected ? colors.action.primary.default : colors.surface.brandTint,
                borderColor: selected ? colors.action.primary.default : colors.border.default,
              }]}
            >
              <AppText variant="caption" style={{ color: selected ? colors.text.onBrand : colors.text.interactive }}>
                {item}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.heading}>
        <View style={styles.grow}>
          <AppText variant="compactLabel">Latest readings</AppText>
          {!loading && !error ? <AppText variant="caption" color="secondary">{filteredReadings.length} {filteredReadings.length === 1 ? 'test' : 'tests'}{scope && !scope.showingAll ? ` chosen of ${scope.total}` : ''}</AppText> : null}
        </View>
        {scope ? (
          <Pressable accessibilityRole="button" onPress={scope.onToggle} style={styles.choose}>
            <AppText variant="caption" style={{ color: colors.text.interactive }}>{scope.showingAll ? 'Show chosen' : 'Show all'}</AppText>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" onPress={onChooseTests} style={styles.choose}>
          <AppText variant="caption" style={{ color: colors.text.interactive }}>Choose tests</AppText>
        </Pressable>
      </View>

      <View style={styles.list}>
        {loading ? (
          <AppText variant="bodySm" color="secondary">Loading readings…</AppText>
        ) : error ? (
          <View>
            <AppText variant="bodySm" color="danger">{error}</AppText>
            <Pressable accessibilityRole="button" onPress={onRetry} style={styles.choose}>
              <AppText variant="label" style={{ color: colors.text.interactive }}>Retry</AppText>
            </Pressable>
          </View>
        ) : filteredReadings.length ? filteredReadings.map(reading => {
          return (
            <View key={reading.id} style={styles.list}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`View ${reading.title} reading details`}
                onPress={() => onSelectReading(reading.id)}
                style={[styles.card, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}
              >
                <Activity size={sizes.icon.md} color={colors.icon.interactive} />
                <View style={styles.grow}>
                  <AppText variant="compactLabel">{reading.title}</AppText>
                  <View style={styles.valueRow}>
                    <AppText variant="numeric">{reading.value}</AppText>
                    <AppText variant="caption" color="secondary">{reading.unit}</AppText>
                  </View>
                  <AppText variant="caption" style={{ color: colors.text.interactive }}>
                    {formatDate(reading.measuredAt) || 'Date not recorded'} · {reading.status}
                  </AppText>
                </View>
                <ChevronRight size={sizes.icon.sm} color={colors.icon.interactive} />
              </Pressable>
            </View>
          );
        }) : (
          <AppText variant="bodySm" color="secondary">
            {readings.length ? 'No readings in this period.' : 'No measurements yet.'}
          </AppText>
        )}
      </View>

      <View style={[styles.notice, { backgroundColor: colors.surface.secondary }]}>
        <Info size={sizes.icon.sm} color={colors.icon.interactive} />
        <AppText variant="caption" color="secondary" style={styles.grow}>
          Dates reflect the latest reading for each test. Weeks start on Monday; undated readings appear under All.
        </AppText>
      </View>

      <Pressable accessibilityRole="button" onPress={onAddReading} style={[styles.add, { backgroundColor: colors.action.primary.default }]}>
        <Plus size={sizes.icon.sm} color={colors.text.onBrand} />
        <AppText variant="label" color="onPrimary">Log a reading</AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: showReadiness }}
        onPress={() => setShowReadiness(!showReadiness)}
        style={styles.choose}
      >
        <AppText variant="caption" style={{ color: colors.text.interactive }}>
          {showReadiness ? 'Hide medical readiness' : 'View medical readiness'}
        </AppText>
      </Pressable>
      {showReadiness ? readiness : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  hidden: { display: 'none' },
  grow: { flex: 1, minWidth: 0 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filter: { minHeight: 36, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  choose: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  list: { gap: 8 },
  card: { minHeight: 96, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1, borderRadius: radius.surface },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: radius.control, gap: 8, padding: 12 },
  add: { minHeight: 44, borderRadius: radius.control, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
