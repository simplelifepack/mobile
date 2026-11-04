import type {
  HealthAvailableMetric,
  HealthMeasurement,
  TrackedHealthMetric,
} from '../../api/web.types';
export function compareMeasurements(
  a: HealthMeasurement,
  b: HealthMeasurement,
) {
  return (
    String(a.measuredAt ?? '').localeCompare(String(b.measuredAt ?? '')) ||
    String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')) ||
    String(a.id ?? '').localeCompare(String(b.id ?? ''))
  );
}
export function metricIdentity(metric: {
  metricKey: string;
  context?: string | null;
  bodySite?: string | null;
}) {
  return [metric.metricKey, metric.context ?? '', metric.bodySite ?? ''].join(
    '|',
  );
}
export function buildHealthMetrics(
  measurements: HealthMeasurement[],
  tracked: TrackedHealthMetric[],
): HealthAvailableMetric[] {
  const trackedKeys = new Set(
    tracked.filter(metric => metric.enabled).map(metricIdentity),
  );
  const grouped = new Map<string, HealthMeasurement[]>();
  measurements.forEach(item => {
    const key = metricIdentity(item),
      rows = grouped.get(key) ?? [];
    rows.push(item);
    grouped.set(key, rows);
  });
  return [...grouped].map(([key, rows]) => {
    const latest = [...rows].sort(compareMeasurements).at(-1)!;
    return {
      metricKey: latest.metricKey,
      displayName: latest.displayName,
      context: latest.context,
      bodySite: latest.bodySite,
      historicalReadingCount: rows.length,
      isTracked: trackedKeys.has(key),
      latestValue: latest.value,
      secondaryValue: latest.secondaryValue,
      unit: latest.unit,
    };
  });
}
