import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import type { HealthMeasurement } from '../../../api/health.api';
import { AppText } from '../../../components/primitives/AppText';
import { AppThemeProvider } from '../../../design/theme/ThemeProvider';
import { readingViews } from '../readingData';
import { ReadingDetail, filterReadingHistory } from './ReadingDetail';
import { TrendChart } from './ReadingViews';

function reading(id: string, date: string | null, extra: Partial<HealthMeasurement> = {}): HealthMeasurement {
  return {
    id, metricKey: 'bp', displayName: 'Blood pressure', originalName: 'BP',
    sourceDocumentId: null, recordId: null, value: 120, secondaryValue: 80,
    measuredAt: date, unit: 'mmHg', sourceType: 'manual', ...extra,
  };
}

it('shows history, plots both values and opens original documents', async () => {
  const preview = jest.fn();
  const add = jest.fn();
  const data = readingViews([
    reading('one', '2026-03-10T12:00:00Z', { sourceDocumentId: 'document' }),
    reading('two', '2026-03-01T12:00:00Z', { value: 125, secondaryValue: 82 }),
  ])[0];
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider>
      <ReadingDetail reading={data} onPreview={preview} onAddReading={add} />
    </AppThemeProvider>);
  });
  expect(renderer.root.findByType(TrendChart).props.measurements).toHaveLength(2);
  const labels = renderer.root.findAllByType(AppText).map(item => item.props.children);
  expect(labels).toContain('Primary value');
  expect(labels).toContain('Secondary value');
  expect(labels).toContain('120/80 mmHg');
  const buttons = renderer.root.findAllByProps({ accessibilityRole: 'button' }).filter(item => typeof item.props.onPress === 'function');
  await act(async () => {
    buttons.find(item => item.props.accessibilityLabel === 'View source document for 120/80 mmHg')!.props.onPress();
    buttons.find(item => item.findAllByType(AppText).some(text => text.props.children === 'Log a reading'))!.props.onPress();
  });
  expect(preview).toHaveBeenCalledWith('document');
  expect(add).toHaveBeenCalled();
});

it('filters history by local week and month and retains undated readings in All', () => {
  const local = (month: number, day: number) => new Date(2026, month - 1, day, 12).toISOString();
  const rows = [reading('today', local(3, 11)), reading('sunday', local(3, 8)), reading('old', local(2, 28)), reading('undated', null)];
  const now = new Date(2026, 2, 11, 14);
  expect(filterReadingHistory(rows, 'All', now)).toHaveLength(4);
  expect(filterReadingHistory(rows, 'This week', now).map(item => item.id)).toEqual(['today']);
  expect(filterReadingHistory(rows, 'This month', now).map(item => item.id)).toEqual(['today', 'sunday']);
});

it('does not chart mixed units', async () => {
  const data = readingViews([reading('a', '2026-03-10', { unit: 'mmHg' }), reading('b', '2026-03-01', { unit: 'kPa' })])[0];
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider><ReadingDetail reading={data} onPreview={jest.fn()} onAddReading={jest.fn()} /></AppThemeProvider>);
  });
  expect(renderer.root.findAllByType(TrendChart)).toHaveLength(0);
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children)).toContain('Trend unavailable because readings use different units.');
});
