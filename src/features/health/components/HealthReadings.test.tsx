import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AppText } from '../../../components/primitives/AppText';
import { AppThemeProvider } from '../../../design/theme/ThemeProvider';
import type { ReadingView } from '../healthTypes';
import { HealthReadings } from './HealthReadings';

const readings: ReadingView[] = [
  { id: 'bp', title: 'Blood pressure', value: '120/80', unit: 'mmHg', status: 'no range on file', measuredAt: '2026-03-01T12:00:00Z', measurements: [], color: 'primary' },
  { id: 'a1c', title: 'HbA1c', value: '7', unit: '%', status: 'outside printed range', range: '4–6', measuredAt: null, measurements: [], color: 'danger' },
];

it('offers date filters and opens the selected reading', async () => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 10, 10, 12));
  const choose = jest.fn();
  const add = jest.fn();
  const select = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider>
      <HealthReadings readings={readings} loading={false} onRetry={jest.fn()} onChooseTests={choose}
        onAddReading={add} onSelectReading={select} readiness={<AppText>Readiness details</AppText>} />
    </AppThemeProvider>);
  });
  const buttons = () => renderer.root.findAllByProps({ accessibilityRole: 'button' }).filter(item => typeof item.props.onPress === 'function');
  const button = (text: string) => buttons().find(item => item.findAllByType(AppText).some(label => label.props.children === text))!;
  const labels = () => renderer.root.findAllByType(AppText).map(item => item.props.children);
  expect(labels()).toContain('Blood pressure');
  expect(labels()).toContain('HbA1c');
  const card = buttons().find(item => item.props.accessibilityLabel === 'View HbA1c reading details')!;
  await act(async () => { card.props.onPress(); });
  expect(select).toHaveBeenCalledWith('a1c');
  await act(async () => { button('This week').props.onPress(); });
  expect(button('This week').props.accessibilityState.selected).toBe(true);
  expect(labels()).not.toContain('Blood pressure');
  expect(labels()).not.toContain('HbA1c');
  expect(labels()).toContain('No readings in this period.');
  await act(async () => {
    button('Choose tests').props.onPress();
    button('Log a reading').props.onPress();
    button('View medical readiness').props.onPress();
  });
  expect(choose).toHaveBeenCalledTimes(1);
  expect(add).toHaveBeenCalledTimes(1);
  expect(labels()).toContain('Readiness details');
  jest.useRealTimers();
});

it('distinguishes loading, failed, and empty states and retries errors', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  const retry = jest.fn();
  const render = (loading: boolean, error?: string) => <AppThemeProvider>
    <HealthReadings readings={[]} loading={loading} error={error} onRetry={retry}
      onChooseTests={jest.fn()} onAddReading={jest.fn()} onSelectReading={jest.fn()} readiness={null} />
  </AppThemeProvider>;
  await act(async () => { renderer = ReactTestRenderer.create(render(true)); });
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children))
    .toContain('Loading readings…');
  await act(async () => { renderer.update(render(false, 'Network error')); });
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children)).toContain('Network error');
  const retryButton = renderer.root.findAllByProps({ accessibilityRole: 'button' }).find(item =>
    typeof item.props.onPress === 'function' && item.findAllByType(AppText).some(label => label.props.children === 'Retry'),
  )!;
  await act(async () => { retryButton.props.onPress(); });
  expect(retry).toHaveBeenCalledTimes(1);
  await act(async () => { renderer.update(render(false)); });
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children))
    .toContain('No measurements yet.');
});
