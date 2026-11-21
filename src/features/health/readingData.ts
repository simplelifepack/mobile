import type { HealthMeasurement, HealthOverview } from '../../api/health.api';
import type { ReadingView } from './healthTypes';

function measuredTime(value?: string | null): number | undefined {
  if (!value) return undefined;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : undefined;
}

export function readingViews(measurements: HealthMeasurement[]): ReadingView[] {
  const groups = new Map<string, HealthMeasurement[]>();
  for (const measurement of measurements) {
    const key = JSON.stringify([measurement.metricKey, measurement.context || '', measurement.bodySite || '']);
    const group = groups.get(key);
    if (group) group.push(measurement);
    else groups.set(key, [measurement]);
  }

  return Array.from(groups, ([id, group]): ReadingView => {
    const sorted = group.slice().sort((a, b) =>
      (measuredTime(b.measuredAt) ?? -Infinity) - (measuredTime(a.measuredAt) ?? -Infinity) ||
      a.id.localeCompare(b.id),
    );
    const latest = sorted[0];
    const outsideRange =
      (latest.referenceMin != null && latest.value < latest.referenceMin) ||
      (latest.referenceMax != null && latest.value > latest.referenceMax);
    return {
      id,
      title: latest.displayName,
      value: latest.secondaryValue == null ? String(latest.value) : `${latest.value}/${latest.secondaryValue}`,
      unit: latest.unit,
      status: outsideRange ? 'outside printed range'
        : latest.referenceMin != null || latest.referenceMax != null ? 'within reference range'
          : latest.referenceText ? 'reference range on file' : 'no range on file',
      range: latest.referenceText ?? (
        latest.referenceMin != null && latest.referenceMax != null ? `${latest.referenceMin}–${latest.referenceMax}`
          : latest.referenceMax != null ? `under ${latest.referenceMax}`
            : latest.referenceMin != null ? `over ${latest.referenceMin}` : undefined
      ),
      measurements: sorted,
      color: outsideRange ? 'danger' : 'primary',
      sourceName: latest.originalName,
      measuredAt: latest.measuredAt,
    };
  }).sort((a, b) =>
    (measuredTime(b.measuredAt) ?? -Infinity) - (measuredTime(a.measuredAt) ?? -Infinity) ||
    a.title.localeCompare(b.title) || a.id.localeCompare(b.id),
  );
}

export type ReadingPeriod = 'All' | 'This week' | 'This month';

export function filterReadingsByPeriod(readings: ReadingView[], period: ReadingPeriod, now = new Date()): ReadingView[] {
  if (period === 'All') return readings;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'This week') start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  else start.setDate(1);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return readings.filter(reading => {
    const time = measuredTime(reading.measuredAt);
    return time !== undefined && time >= start.getTime() && time < end.getTime();
  });
}

export const readingKey = (item: Pick<HealthMeasurement, 'metricKey' | 'context' | 'bodySite'>) =>
  JSON.stringify([item.metricKey, item.context || '', item.bodySite || '']);

/** Adds a saved measurement to a list without duplicating it if a refetch already returned it. */
export function withMeasurement(measurements: HealthMeasurement[], created: HealthMeasurement) {
  return measurements.some(item => item.id === created.id) ? measurements : [...measurements, created];
}

export function withTrackedMeasurement(overview: HealthOverview, created: HealthMeasurement): HealthOverview {
  const key = readingKey(created);
  return {
    ...overview,
    trackedMetrics: overview.trackedMetrics.map(metric => {
      if (readingKey(metric) !== key) return metric;
      const measurements = withMeasurement(metric.measurements, created);
      const latest = measurements.reduce<HealthMeasurement | null>((best, item) =>
        !best || (measuredTime(item.measuredAt) ?? -Infinity) >= (measuredTime(best.measuredAt) ?? -Infinity) ? item : best, null);
      return { ...metric, measurements, latest };
    }),
  };
}

/** Keeps only the tests the user chose to chart; with no chosen tests every reading is shown. */
export function filterChosenReadings(readings: ReadingView[], chosen: Array<Pick<HealthMeasurement, 'metricKey' | 'context' | 'bodySite'>>) {
  if (!chosen.length) return readings;
  const keys = new Set(chosen.map(readingKey));
  return readings.filter(reading => keys.has(reading.id));
}
