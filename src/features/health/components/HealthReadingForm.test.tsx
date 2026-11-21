import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { healthApi, type HealthMeasurement } from '../../../api/health.api';
import { Button } from '../../../components/primitives/Button';
import { AppThemeProvider } from '../../../design/theme/ThemeProvider';
import { AppText } from '../../../components/primitives/AppText';
import { DatePickerInput } from '../../../components/primitives/DatePickerInput';
import { ReadingField, HealthReadingForm } from './HealthForms';

const initial: HealthMeasurement = {
  id: 'bp', metricKey: 'blood_pressure', displayName: 'Blood pressure', originalName: 'BP',
  sourceDocumentId: 'document', recordId: null, value: 120, secondaryValue: 80,
  unit: 'mmHg', measuredAt: '2026-03-01', sourceType: 'document',
  context: 'resting', bodySite: 'arm',
};

afterEach(() => jest.restoreAllMocks());

it('logs a paired reading for the selected test with its identity and recorded range', async () => {
  const create = jest.spyOn(healthApi, 'createMeasurement').mockResolvedValue(initial);
  const onCreated = jest.fn().mockResolvedValue(undefined);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider>
      <HealthReadingForm memberId="m1" memberName="Divya" initialMeasurement={initial}
        onClose={jest.fn()} onCreated={onCreated} />
    </AppThemeProvider>);
  });

  const field = (label: string) => renderer.root.findAllByType(ReadingField).find(item => item.props.label === label)!;
  await act(async () => {
    renderer.root.findAllByProps({ accessibilityRole: 'button' }).find(item =>
      typeof item.props.onPress === 'function' && item.findAllByType(AppText).some(text => text.props.children === 'Add reference range (optional)'),
    )!.props.onPress();
  });
  await act(async () => {
    field('Systolic · mmHg').props.onChangeText('130');
    field('Diastolic · mmHg').props.onChangeText('85');
    field('Range low (optional)').props.onChangeText('100');
    field('Range high (optional)').props.onChangeText('140');
    field('Time (24h)').props.onChangeText('08:30');
    field('Source (optional)').props.onChangeText(' Home monitor ');
    field('Notes (optional)').props.onChangeText(' After walk ');
  });
  await act(async () => {
    renderer.root.findAllByType(Button).find(item => item.props.title === 'Save')!.props.onPress();
  });
  expect(create).toHaveBeenCalledWith('m1', expect.objectContaining({
    metricKey: 'blood_pressure', value: 130, secondaryValue: 85, context: 'resting',
    bodySite: 'arm', referenceMin: 100, referenceMax: 140, source: 'Home monitor', notes: 'After walk',
    timeZone: expect.any(String),
  }));
  expect(new Date(create.mock.calls[0][1].measuredAt).getHours()).toBe(8);
  expect(onCreated).toHaveBeenCalledTimes(1);
});

it('reopens the reference range when a hidden range is invalid', async () => {
  const create = jest.spyOn(healthApi, 'createMeasurement').mockResolvedValue(initial);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider>
      <HealthReadingForm memberId="m1" memberName="Divya" initialMeasurement={initial}
        onClose={jest.fn()} onCreated={jest.fn()} />
    </AppThemeProvider>);
  });
  const toggle = () => renderer.root.findAllByProps({ accessibilityRole: 'button' }).find(item =>
    typeof item.props.onPress === 'function' && item.findAllByType(AppText).some(text =>
      text.props.children === 'Add reference range (optional)' || text.props.children === 'Hide reference range',
    ),
  )!;
  await act(async () => { toggle().props.onPress(); });
  await act(async () => {
    renderer.root.findAllByType(ReadingField).find(item => item.props.label === 'Systolic · mmHg')!.props.onChangeText('120');
    renderer.root.findAllByType(ReadingField).find(item => item.props.label === 'Range low (optional)')!.props.onChangeText('invalid');
  });
  await act(async () => { toggle().props.onPress(); });
  await act(async () => { renderer.root.findAllByType(Button).find(item => item.props.title === 'Save')!.props.onPress(); });
  expect(create).not.toHaveBeenCalled();
  expect(renderer.root.findAllByType(ReadingField).some(item => item.props.label === 'Range low (optional)')).toBe(true);
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children)).toContain('Enter a valid reference range.');
});

it('allows choosing blood pressure from the general entry form and validates inputs', async () => {
    const create = jest.spyOn(healthApi, 'createMeasurement').mockResolvedValue(initial);
    let renderer!: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(<AppThemeProvider>
        <HealthReadingForm memberId="m1" memberName="Divya" onClose={jest.fn()} onCreated={jest.fn().mockResolvedValue(undefined)} />
      </AppThemeProvider>);
    });
    const buttons = () => renderer.root.findAllByProps({ accessibilityRole: 'button' }).filter(item => typeof item.props.onPress === 'function');
    await act(async () => { buttons().find(item => item.props.accessibilityLabel === 'Choose reading type')!.props.onPress(); });
    await act(async () => {
      buttons().find(item => item.findAllByType(AppText).some(text => text.props.children === 'Blood Pressure'))!.props.onPress();
    });
    const field = (label: string) => renderer.root.findAllByType(ReadingField).find(item => item.props.label === label)!;
    expect(field('Systolic · mmHg')).toBeDefined();
    expect(field('Diastolic · mmHg')).toBeDefined();
    await act(async () => { renderer.root.findAllByType(Button).find(item => item.props.title === 'Save')!.props.onPress(); });
    expect(create).not.toHaveBeenCalled();
    expect(renderer.root.findAllByType(AppText).map(item => item.props.children)).toContain('Enter a test name and a valid numeric value.');
    await act(async () => {
      field('Systolic · mmHg').props.onChangeText('120');
      field('Diastolic · mmHg').props.onChangeText('80');
    });
    await act(async () => { renderer.root.findAllByType(Button).find(item => item.props.title === 'Save')!.props.onPress(); });
    expect(create).toHaveBeenCalledWith('m1', expect.objectContaining({ metricKey: 'blood_pressure', value: 120, secondaryValue: 80 }));
});

it('matches the reference labels and editable time, source and notes fields', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider>
      <HealthReadingForm memberId="m1" memberName="Divya" initialMeasurement={initial} onClose={jest.fn()} onCreated={jest.fn()} />
    </AppThemeProvider>);
  });
  const labels = renderer.root.findAllByType(AppText).map(item => item.props.children);
  expect(labels).toEqual(expect.arrayContaining([
    'Log a reading', 'Reading type', 'Date', 'Time (24h)', 'Source (optional)', 'Notes (optional)',
    'Add a value from your home device or report.', 'Private health vault',
  ]));
  await act(async () => {
    renderer.root.findByType(DatePickerInput).props.onChangeText('11/08/2026');
  });
  const date = renderer.root.findByType(DatePickerInput);
  expect(date.props.value).toBe('11/08/2026');
  expect(date.props.displayValue).toBe('08 Nov 2026');
  expect(renderer.root.findAllByProps({ accessibilityLabel: 'Date 08 Nov 2026. Change date' }).length).toBeGreaterThan(0);
});
