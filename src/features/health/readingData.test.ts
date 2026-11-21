import type { HealthMeasurement } from '../../api/health.api';
import { filterReadingsByPeriod, readingViews } from './readingData';

function measurement(id: string, metricKey: string, measuredAt: string | null, extra: Partial<HealthMeasurement> = {}): HealthMeasurement {
  return {
    id, metricKey, measuredAt, displayName: metricKey, originalName: metricKey,
    sourceDocumentId: null, recordId: null, value: 1, unit: 'mg', sourceType: 'manual', ...extra,
  };
}

it('includes untracked tests, groups by metric and context, and sorts latest dates first', () => {
  const readings = readingViews([
    measurement('old', 'glucose', '2026-03-01T10:00:00Z', { value: 3 }),
    measurement('undated', 'undated', null),
    measurement('new', 'glucose', '2026-03-10T10:00:00Z', { value: 7, referenceMin: 2, referenceMax: 5 }),
    measurement('bp', 'pressure', '2026-03-15T10:00:00Z', { secondaryValue: 80 }),
    measurement('fasting', 'glucose', '2026-03-05T10:00:00Z', { context: 'fasting' }),
  ]);
  expect(readings.map(item => item.sourceName)).toEqual(['pressure', 'glucose', 'glucose', 'undated']);
  expect(readings[0].value).toBe('1/80');
  expect(readings[1]).toMatchObject({ value: '7', status: 'outside printed range', range: '2–5' });
  expect(readings[1].measurements).toHaveLength(2);
});

it('uses local calendar week and month through today, excluding undated and future readings', () => {
  const local = (year: number, month: number, day: number) => new Date(year, month - 1, day, 12).toISOString();
  const readings = readingViews([
    measurement('today', 'today', local(2026, 3, 11)),
    measurement('monday', 'monday', local(2026, 3, 9)),
    measurement('sunday', 'sunday', local(2026, 3, 8)),
    measurement('lastmonth', 'lastmonth', local(2026, 2, 28)),
    measurement('tomorrow', 'tomorrow', local(2026, 3, 12)),
    measurement('unknown', 'unknown', null),
  ]);
  const now = new Date(2026, 2, 11, 15);
  expect(filterReadingsByPeriod(readings, 'All', now)).toHaveLength(6);
  expect(filterReadingsByPeriod(readings, 'This week', now).map(item => item.title)).toEqual(['today', 'monday']);
  expect(filterReadingsByPeriod(readings, 'This month', now).map(item => item.title)).toEqual(['today', 'monday', 'sunday']);
});
