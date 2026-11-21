import type { HealthMeasurement } from '../../api/health.api';
import { trendGeometry } from './trendGeometry';

it('includes secondary values in the chart scale and preserves missing secondary points', () => {
  const rows: HealthMeasurement[] = [
    { id: 'a', metricKey: 'bp', displayName: 'BP', originalName: 'BP', sourceDocumentId: null, recordId: null, value: 120, secondaryValue: 80, unit: 'mmHg', measuredAt: '2026-01-01', sourceType: 'manual' },
    { id: 'b', metricKey: 'bp', displayName: 'BP', originalName: 'BP', sourceDocumentId: null, recordId: null, value: 130, unit: 'mmHg', measuredAt: '2026-02-01', sourceType: 'manual' },
  ];
  const chart = trendGeometry(rows)!;
  expect(chart.min).toBeLessThan(80);
  expect(chart.points[0].secondaryY).toBeDefined();
  expect(chart.points[1].secondaryY).toBeUndefined();
  expect(chart.points[0].secondaryY!).toBeGreaterThan(chart.points[0].y);
});
