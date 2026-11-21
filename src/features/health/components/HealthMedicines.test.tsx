import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import type { HealthRecord, HealthTimelineEvent } from '../../../api/health.api';
import { AppText } from '../../../components/primitives/AppText';
import { AppThemeProvider } from '../../../design/theme/ThemeProvider';
import { HealthMedicines } from './HealthMedicines';

const timeline: HealthTimelineEvent[] = [
  {
    id: 'medicine-1', eventType: 'medication', recordId: 'health-record', occurredAt: null,
    title: 'Vitamin D', source: 'Medication recorded', sourceType: 'prescription',
    medication: { name: 'Vitamin D', dose: '1 capsule', frequency: 'weekly', mealTiming: 'after_food', status: 'continuing', repeats: true },
  },
  {
    id: 'medicine-2', eventType: 'medication', occurredAt: null, title: 'Past medicine',
    source: 'Manual medication', sourceType: 'manual',
    medication: { name: 'Past medicine', status: 'stopped', repeats: false },
  },
  {
    id: 'medicine-3', eventType: 'medication', occurredAt: null, title: 'Unconfirmed',
    source: 'Manual medication', sourceType: 'manual',
    medication: { name: 'Unconfirmed', status: 'unknown', repeats: false },
  },
];
const records: HealthRecord[] = [{
  id: 'health-record', memberId: 'member', documentId: 'document-1', type: 'prescription',
  doctor: 'Dr Rao', documentDate: null, processingStatus: 'processed',
  measurementCount: 0, trackedMeasurementCount: 0, medicationCount: 1,
  followUpCount: 0, createdAt: '2026-01-01',
}];

it('filters medicines and routes source, status, and add actions', async () => {
  const preview = jest.fn();
  const toggle = jest.fn();
  const add = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider>
      <HealthMedicines timeline={timeline} records={records} onAdd={add} onPreview={preview} onToggle={toggle} />
    </AppThemeProvider>);
  });
  const labels = () => renderer.root.findAllByType(AppText).map(item => item.props.children);
  const buttons = () => renderer.root.findAllByProps({ accessibilityRole: 'button' }).filter(item => typeof item.props.onPress === 'function');
  const byLabel = (label: string) => buttons().find(item => item.props.accessibilityLabel === label)!;
  expect(labels()).toContain('Vitamin D');
  expect(labels()).toContain('1 capsule · weekly');
  expect(labels()).toContain('After food');
  expect(labels()).toContain('Dr Rao');
  expect(labels()).toContain('Unconfirmed');
  expect(labels()).not.toContain('Past medicine');
  await act(async () => {
    renderer.update(<AppThemeProvider>
      <HealthMedicines timeline={timeline} records={records} updatingId="medicine-1" onAdd={add} onPreview={preview} onToggle={toggle} />
    </AppThemeProvider>);
  });
  expect(byLabel('Mark stopped: Vitamin D').props.accessibilityState.disabled).toBe(true);
  expect(labels()).toContain('Updating…');
  await act(async () => {
    renderer.update(<AppThemeProvider>
      <HealthMedicines timeline={timeline} records={records} onAdd={add} onPreview={preview} onToggle={toggle} />
    </AppThemeProvider>);
  });
  await act(async () => {
    byLabel('View original record for Vitamin D').props.onPress();
    byLabel('Mark stopped: Vitamin D').props.onPress();
    byLabel('Add medicine').props.onPress();
  });
  expect(preview).toHaveBeenCalledWith('document-1');
  expect(toggle).toHaveBeenCalledWith('medicine-1', false);
  expect(add).toHaveBeenCalledTimes(1);
  await act(async () => {
    buttons().find(item => item.findAllByType(AppText).some(text => Array.isArray(text.props.children) && text.props.children.join('') === 'Past · 1'))!.props.onPress();
  });
  expect(labels()).toContain('Past medicine');
  expect(labels()).not.toContain('Vitamin D');
  await act(async () => { byLabel('Resume: Past medicine').props.onPress(); });
  expect(toggle).toHaveBeenCalledWith('medicine-2', true);
  expect(buttons().some(item => item.props.accessibilityLabel === 'Resume: Unconfirmed')).toBe(false);
});

it('distinguishes unavailable and empty data without fabricating source details', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  const render = (events?: HealthTimelineEvent[]) => <AppThemeProvider>
    <HealthMedicines timeline={events} onAdd={jest.fn()} onPreview={jest.fn()} onToggle={jest.fn()} />
  </AppThemeProvider>;
  await act(async () => { renderer = ReactTestRenderer.create(render()); });
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children)).toContain('Medicines unavailable. Pull to refresh.');
  await act(async () => { renderer.update(render([])); });
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children)).toContain('No current medicines.');
  await act(async () => { renderer.update(render(timeline)); });
  expect(renderer.root.findAllByProps({ accessibilityLabel: 'View original record for Vitamin D' })).toHaveLength(0);
});
