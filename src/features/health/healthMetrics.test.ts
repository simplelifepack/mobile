import { buildHealthMetrics } from './healthMetrics';
import type {
  HealthMeasurement,
  TrackedHealthMetric,
} from '../../api/web.types';
it('keeps contexts separate and recognizes the tracked identity used by web', () => {
  const reading = (context: string, value: number, date: string) =>
    ({
      metricKey: 'glucose',
      context,
      displayName: 'Glucose',
      unit: 'mg/dL',
      value,
      measuredAt: date,
    }) as HealthMeasurement;
  const tracked = [
    { id: 'tracked', metricKey: 'glucose', context: 'fasting', enabled: true },
  ] as TrackedHealthMetric[];
  expect(
    buildHealthMetrics(
      [
        reading('fasting', 98, '2026-10-20'),
        reading('fasting', 101, '2026-10-25'),
        reading('random', 115, '2026-10-25'),
      ],
      tracked,
    ),
  ).toMatchObject([
    {
      context: 'fasting',
      latestValue: 101,
      historicalReadingCount: 2,
      isTracked: true,
    },
    {
      context: 'random',
      latestValue: 115,
      historicalReadingCount: 1,
      isTracked: false,
    },
  ]);
});
it('uses creation order to choose the latest of two readings on the same date', () => {
  const readings = [
    {
      id: 'older',
      metricKey: 'alp',
      displayName: 'ALP',
      value: 20,
      unit: 'U/L',
      measuredAt: '2026-11-01',
      createdAt: '2026-11-01T04:00:00Z',
    },
    {
      id: 'newer',
      metricKey: 'alp',
      displayName: 'ALP',
      value: 90,
      unit: 'U/L',
      measuredAt: '2026-11-01',
      createdAt: '2026-11-01T05:00:00Z',
    },
  ] as HealthMeasurement[];
  expect(buildHealthMetrics(readings, [])[0].latestValue).toBe(90);
  expect(buildHealthMetrics([...readings].reverse(), [])[0].latestValue).toBe(
    90,
  );
});
