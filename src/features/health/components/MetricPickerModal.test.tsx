import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { healthApi, type HealthAvailableMetric, type TrackedHealthMetric } from '../../../api/health.api';
import { AppText } from '../../../components/primitives/AppText';
import { AppThemeProvider } from '../../../design/theme/ThemeProvider';
import { MetricPickerModal } from './AddToHealthSheet';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 24, left: 0, right: 0 }),
}));

const available: HealthAvailableMetric[] = [
  { metricKey: 'bp', displayName: 'Blood pressure', historicalReadingCount: 2, isTracked: true, latestValue: 120, secondaryValue: 80, unit: 'mmHg' },
  { metricKey: 'weight', displayName: 'Weight', historicalReadingCount: 1, isTracked: false, latestValue: 65, unit: 'kg' },
];
const tracked: TrackedHealthMetric[] = [
  { id: 'tracked-bp', memberId: 'member', metricKey: 'bp', displayName: 'Blood pressure', enabled: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
];

afterEach(() => jest.restoreAllMocks());

async function render(onClose = jest.fn(), onChanged = jest.fn().mockResolvedValue(undefined)) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider>
      <MetricPickerModal memberId="member" memberName="Pat" onClose={onClose} onChanged={onChanged} />
    </AppThemeProvider>);
  });
  return renderer;
}

it('shows compact selection counts and latest values, then preserves reset and save behavior', async () => {
  jest.spyOn(healthApi, 'availableMetrics').mockResolvedValue(available);
  jest.spyOn(healthApi, 'trackedMetrics').mockResolvedValue(tracked);
  const add = jest.spyOn(healthApi, 'trackMetric').mockResolvedValue({ ...tracked[0], id: 'tracked-weight', metricKey: 'weight' });
  const onClose = jest.fn();
  const onChanged = jest.fn().mockResolvedValue(undefined);
  const renderer = await render(onClose, onChanged);
  const text = () => renderer.root.findAllByType(AppText).map(item => React.Children.toArray(item.props.children).join(''));
  expect(text()).toContain('1 of 2 selected');
  expect(text()).toContain('120/80 mmHg');
  const rows = renderer.root.findAllByProps({ accessibilityRole: 'checkbox' }).filter(item => typeof item.props.onPress === 'function');
  await act(async () => { rows[1].props.onPress(); });
  expect(text()).toContain('2 of 2 selected');
  await act(async () => {
    renderer.root.findAllByProps({ accessibilityRole: 'button' }).find(item =>
      item.findAllByType(AppText).some(label => label.props.children === 'Reset'),
    )!.props.onPress();
  });
  expect(text()).toContain('1 of 2 selected');
  await act(async () => { rows[1].props.onPress(); });
  await act(async () => {
    renderer.root.findAllByProps({ accessibilityRole: 'button' }).find(item =>
      item.findAllByType(AppText).some(label => label.props.children === 'Done'),
    )!.props.onPress();
  });
  expect(add).toHaveBeenCalledWith('member', expect.objectContaining({ metricKey: 'weight' }));
  expect(onChanged).toHaveBeenCalled();
  expect(onClose).toHaveBeenCalled();
});

it('shows an explicit loading error instead of an empty-list message', async () => {
  jest.spyOn(healthApi, 'availableMetrics').mockRejectedValue(new Error('Tests unavailable'));
  jest.spyOn(healthApi, 'trackedMetrics').mockResolvedValue([]);
  const renderer = await render();
  const text = renderer.root.findAllByType(AppText).map(item => item.props.children);
  expect(text).toContain('Tests unavailable');
  expect(text).not.toContain('No tests found in this profile.');
});
