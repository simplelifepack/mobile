import { trendGeometry } from './trendGeometry';
import type { HealthMeasurement } from '../../api/web.types';
const reading = (date: string, value: number, extra = {}): HealthMeasurement =>
  ({
    id: date,
    measuredAt: date,
    value,
    referenceMin: 3,
    referenceMax: 7,
    ...extra,
  }) as HealthMeasurement;
it('spaces irregular dates by elapsed time and includes reference limits in the scale', () => {
  const chart = trendGeometry([
    reading('2026-01-11', 6),
    reading('2026-01-01', 5),
    reading('2026-01-02', 4),
  ])!;
  expect(chart.points.map(point => point.x)).toEqual([38, 68, 338]);
  expect(chart.min).toBeLessThan(3);
  expect(chart.max).toBeGreaterThan(7);
});
it('retains history past twelve readings and renders a single point without NaN', () => {
  expect(
    trendGeometry(
      Array.from({ length: 20 }, (_, i) =>
        reading(`2026-01-${String(i + 1).padStart(2, '0')}`, i),
      ),
    )!.rows,
  ).toHaveLength(20);
  expect(trendGeometry([reading('2026-01-01', 5)])!.points[0].x).toBe(188);
  expect(trendGeometry([reading('2026-01-01', NaN)])).toBeNull();
});
it('separates same-day observations and labels their spacing as sequential', () => {
  const chart = trendGeometry([
    reading('2026-11-01', 90, { id: 'new', createdAt: '2026-11-01T05:00:00Z' }),
    reading('2026-11-01', 20, { id: 'old', createdAt: '2026-11-01T04:00:00Z' }),
  ])!;
  expect(chart.points.map(point => point.x)).toEqual([38, 338]);
  expect(chart.rows.map(row => row.value)).toEqual([20, 90]);
  expect(chart.sequential).toBe(true);
});
