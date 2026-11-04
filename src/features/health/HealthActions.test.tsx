import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { HealthMetricChooser } from './HealthMetricChooser';
import { ReadingDialog } from './ReadingDialog';
import { healthApi } from '../../api/health.api';
import { Button } from '../../components/primitives/Button';
import { TextInput } from '../../components/primitives/TextInput';
jest.mock('../../components/primitives/AppModal', () => ({
  AppModal: ({ children }: React.PropsWithChildren) => children,
}));
jest.mock('../../app/store/hooks', () => ({ useAppSelector: () => 'owner' }));
jest.mock('../../storage/formDraftStorage', () => ({
  readDraft: jest.fn().mockResolvedValue(undefined),
  writeDraft: jest.fn().mockResolvedValue(undefined),
  clearDraft: jest.fn().mockResolvedValue(undefined),
  draftKey: () => 'reading',
}));
jest.mock('../../api/health.api', () => ({
  healthApi: {
    availableMetrics: jest.fn(),
    trackedMetrics: jest.fn(),
    trackMetric: jest.fn(),
    untrackMetric: jest.fn(),
    createMeasurement: jest.fn(),
  },
}));
it('opens the test chooser for an account with tracked tests but no readings', async () => {
  jest.mocked(healthApi.availableMetrics).mockResolvedValue([]);
  jest.mocked(healthApi.trackedMetrics).mockResolvedValue([
    {
      id: 'tracked',
      metricKey: 'cholesterol',
      displayName: 'Total Cholesterol',
      enabled: true,
    } as never,
  ]);
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <AppThemeProvider>
        <HealthMetricChooser
          memberId="member"
          onClose={jest.fn()}
          onChanged={jest.fn()}
        />
      </AppThemeProvider>,
    );
  });
  expect(JSON.stringify(tree.toJSON())).toContain('Total Cholesterol');
  expect(JSON.stringify(tree.toJSON())).not.toContain('Search measurements');
  expect(JSON.stringify(tree.toJSON())).not.toContain('Find a test');
  expect(
    tree.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Apply selected tests')?.props
      .disabled,
  ).toBe(false);
  await act(async () => tree.unmount());
});
it('opens a reading form without historical measurements and validates its exact fields', async () => {
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <AppThemeProvider>
        <ReadingDialog
          memberId="member"
          memberName="Test"
          measurements={[]}
          onClose={jest.fn()}
          onSaved={jest.fn()}
        />
      </AppThemeProvider>,
    );
  });
  const save = () =>
    tree.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Save reading')!;
  expect(save().props.disabled).toBe(true);
  const field = (label: string) =>
    tree.root
      .findAllByType(TextInput)
      .find(node => node.props.label === label)!;
  await act(async () => {
    field('Test name').props.onChangeText('Total Cholesterol');
    field('Unit').props.onChangeText('mg/dL');
    field('Value').props.onChangeText('150');
  });
  expect(save().props.disabled).toBe(false);
  await act(async () => tree.unmount());
});
it('logs the chosen tracked test instead of switching to another test', async () => {
  jest.mocked(healthApi.createMeasurement).mockResolvedValue({} as never);
  const saved = jest.fn(),
    close = jest.fn();
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <AppThemeProvider>
        <ReadingDialog
          memberId="member"
          memberName="Test"
          onClose={close}
          onSaved={saved}
          initialTest={{
            metricKey: 'cholesterol',
            displayName: 'Total Cholesterol',
            unit: '',
          }}
          measurements={[
            {
              metricKey: 'blood_pressure',
              displayName: 'Blood pressure',
              unit: 'mmHg',
              measuredAt: '2026-10-30',
            } as never,
          ]}
        />
      </AppThemeProvider>,
    );
  });
  const field = (label: string) =>
    tree.root
      .findAllByType(TextInput)
      .find(node => node.props.label === label)!;
  expect(JSON.stringify(tree.toJSON())).toContain('Total Cholesterol');
  await act(async () => {
    field('Unit').props.onChangeText('mg/dL');
    field('Value').props.onChangeText('150');
  });
  const save = tree.root
    .findAllByType(Button)
    .find(node => node.props.title === 'Save reading')!;
  expect(save.props.disabled).toBe(false);
  await act(async () => {
    await save.props.onPress();
  });
  expect(healthApi.createMeasurement).toHaveBeenCalledWith(
    'member',
    expect.objectContaining({
      metricKey: 'cholesterol',
      displayName: 'Total Cholesterol',
      unit: 'mg/dL',
      value: 150,
    }),
  );
  expect(saved).toHaveBeenCalledTimes(1);
  expect(close).toHaveBeenCalledTimes(1);
  await act(async () => tree.unmount());
});
it('keeps the unit editable on existing tests and prevents incompatible units from being saved', async () => {
  let tree!: Renderer.ReactTestRenderer;
  await act(async () => {
    tree = Renderer.create(
      <AppThemeProvider>
        <ReadingDialog
          memberId="member"
          memberName="Test"
          measurements={[]}
          initialTest={{
            metricKey: 'alkaline_phosphatase',
            displayName: 'Alkaline Phosphatase',
            unit: 'cm',
          }}
          onClose={jest.fn()}
          onSaved={jest.fn()}
        />
      </AppThemeProvider>,
    );
  });
  const field = (label: string) =>
    tree.root
      .findAllByType(TextInput)
      .find(node => node.props.label === label)!;
  const save = () =>
    tree.root
      .findAllByType(Button)
      .find(node => node.props.title === 'Save reading')!;
  expect(field('Unit').props.value).toBe('cm');
  await act(async () => field('Value').props.onChangeText('90'));
  expect(save().props.disabled).toBe(true);
  await act(async () => field('Unit').props.onChangeText('U/L'));
  expect(save().props.disabled).toBe(false);
  await act(async () => tree.unmount());
});
