import type { HealthMeasurement } from '../../api/health.api';

const compareMeasurements = (a: HealthMeasurement, b: HealthMeasurement) =>
  String(a.measuredAt ?? '').localeCompare(String(b.measuredAt ?? '')) ||
  a.id.localeCompare(b.id);

export const CHART = { width: 360, height: 150, left: 38, right: 338, top: 20, bottom: 122 } as const;

export function trendGeometry(measurements: HealthMeasurement[]) {
  const rows = measurements.filter(row => Number.isFinite(row.value)).sort(compareMeasurements);
  if (!rows.length) return null;

  const latest = rows[rows.length - 1];
  const limits = [latest.referenceMin, latest.referenceMax].filter(
    (value): value is number => value != null && Number.isFinite(value),
  );
  const values = [...rows.map(row => row.value), ...limits];
  const low = Math.min(...values);
  const high = Math.max(...values);
  const pad = Math.max((high - low) * 0.25, Math.abs(high) * 0.1, 1);
  const min = low - pad;
  const max = high + pad;
  const plotHeight = CHART.bottom - CHART.top;
  const plotWidth = CHART.right - CHART.left;
  const y = (value: number) => CHART.bottom - ((value - min) / (max - min)) * plotHeight;

  // Spread points by elapsed time when every reading has a distinct date, otherwise by order.
  const times = rows.map(row => (row.measuredAt ? Date.parse(row.measuredAt) : NaN));
  const dated = times.every(Number.isFinite) && new Set(times).size === times.length;
  const start = times[0];
  const end = times[times.length - 1];
  const points = rows.map((row, index) => ({
    x:
      rows.length === 1
        ? (CHART.left + CHART.right) / 2
        : CHART.left + (dated ? (times[index] - start) / (end - start) : index / (rows.length - 1)) * plotWidth,
    y: y(row.value),
  }));

  return { rows, points, min, max, limits, y, sequential: rows.length > 1 && !dated };
}
