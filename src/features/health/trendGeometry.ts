import { compareMeasurements } from './healthMetrics';
import type { HealthMeasurement } from '../../api/web.types';
export function trendGeometry(measurements: HealthMeasurement[]) {
  const rows = measurements
    .filter(row => Number.isFinite(row.value))
    .slice()
    .sort(compareMeasurements);
  if (!rows.length) return null;
  const latest = rows[rows.length - 1];
  const limits = [latest.referenceMin, latest.referenceMax].filter(
    (value): value is number => value != null && Number.isFinite(value),
  );
  const values = [...rows.map(row => row.value), ...limits];
  const low = Math.min(...values),
    high = Math.max(...values);
  const pad = Math.max((high - low) * 0.25, Math.abs(high) * 0.1, 1);
  const min = low - pad,
    max = high + pad;
  const y = (value: number) => 112 - ((value - min) / (max - min)) * 88;
  const times = rows.map(row =>
    row.measuredAt ? Date.parse(row.measuredAt) : NaN,
  );
  const dated =
    times.every(Number.isFinite) && new Set(times).size === times.length;
  const start = times[0],
    end = times[times.length - 1];
  const points = rows.map((row, index) => ({
    x:
      rows.length === 1 || (dated && start === end)
        ? 188
        : 38 +
          (dated
            ? (times[index] - start) / (end - start)
            : index / (rows.length - 1)) *
            300,
    y: y(row.value),
  }));
  return {
    rows,
    points,
    min,
    max,
    limits,
    y,
    sequential: rows.length > 1 && !dated,
  };
}
