import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Modal, TextInput } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { healthApi, type HealthMedication } from '../../../api/health.api';
import { AppText } from '../../../components/primitives/AppText';
import { Button } from '../../../components/primitives/Button';
import { DatePickerInput } from '../../../components/primitives/DatePickerInput';
import { AppThemeProvider } from '../../../design/theme/ThemeProvider';
import { MedicationForm } from './MedicationForm';

const medication: HealthMedication = {
  id: 'm', memberId: 'member', name: 'Vitamin D', dose: '1 capsule',
  status: 'continuing', repeats: false, createdAt: '2026-01-01',
};

afterEach(() => jest.restoreAllMocks());

it('saves optional course details and marks unsupported links unavailable', async () => {
  const create = jest.spyOn(healthApi, 'createMedication').mockResolvedValue(medication);
  const onCreated = jest.fn().mockResolvedValue(undefined);
  const close = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider>
      <MedicationForm memberId="member" memberName="Divya" onClose={close} onCreated={onCreated} />
    </AppThemeProvider>);
  });
  const labels = renderer.root.findAllByType(AppText).map(item => item.props.children);
  const modalProvider = renderer.root.findByType(Modal).findByType(SafeAreaProvider);
  expect(modalProvider.findAllByType(SafeAreaView)).toHaveLength(1);
  expect(labels).toEqual(expect.arrayContaining(['Add medicine', 'Private health vault', 'Medicine name & strength', 'Dose']));
  for (const label of ['Linked prescription', 'Scheduled reminder']) {
    const field = renderer.root.findAllByProps({ accessibilityLabel: `${label}: unavailable until backend support is added` })[0];
    expect(field.props.accessibilityState.disabled).toBe(true);
  }
  const press = (label: string) => renderer.root.findAllByProps({ accessibilityLabel: label }).find(item => typeof item.props.onPress === 'function')!.props.onPress();
  await act(async () => {
    renderer.root.findAllByType(TextInput).find(item => item.props.accessibilityLabel === 'Medicine name & strength')!.props.onChangeText(' Vitamin D 60000 IU ');
    renderer.root.findAllByType(TextInput).find(item => item.props.accessibilityLabel === 'Dose')!.props.onChangeText(' 1 capsule ');
    renderer.root.findAllByType(TextInput).find(item => item.props.accessibilityLabel === 'Route')!.props.onChangeText(' oral ');
    renderer.root.findAllByType(TextInput).find(item => item.props.accessibilityLabel === 'Prescribing doctor')!.props.onChangeText(' Dr Rao ');
    press('When to take it: Night');
    press('With meals: With food');
    renderer.root.findAllByType(DatePickerInput).slice(-1)[0].props.onChangeText('11/15/2026');
  });
  expect(renderer.root.findAllByType(DatePickerInput).some(item => item.props.displayValue === '15 Nov 2026')).toBe(true);
  await act(async () => { renderer.root.findAllByType(Button).find(item => item.props.title === 'Save')!.props.onPress(); });
  expect(create).toHaveBeenCalledWith('member', {
    name: 'Vitamin D 60000 IU', dose: '1 capsule', whenToTake: ['night'],
    mealTiming: 'with_food', repeatRunsOut: '2026-11-15', route: 'oral', prescribingDoctor: 'Dr Rao',
  });
  expect(onCreated).toHaveBeenCalledTimes(1);
  expect(close).toHaveBeenCalledTimes(1);
});

it('validates required fields and displays save failures', async () => {
  const create = jest.spyOn(healthApi, 'createMedication').mockRejectedValue(new Error('Network failed'));
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider>
      <MedicationForm memberId="member" memberName="Divya" onClose={jest.fn()} onCreated={jest.fn()} />
    </AppThemeProvider>);
  });
  const save = () => renderer.root.findAllByType(Button).find(item => item.props.title === 'Save')!.props.onPress();
  await act(async () => { save(); });
  expect(create).not.toHaveBeenCalled();
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children)).toContain('Medicine name and dose are required.');
  await act(async () => {
    renderer.root.findAllByType(TextInput).find(item => item.props.accessibilityLabel === 'Medicine name & strength')!.props.onChangeText('Medicine');
    renderer.root.findAllByType(TextInput).find(item => item.props.accessibilityLabel === 'Dose')!.props.onChangeText('10 mg');
  });
  await act(async () => { save(); });
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children)).toContain('Network failed');
  expect(renderer.root.findAllByType(Button).find(item => item.props.title === 'Save')!.props.disabled).toBe(false);
});

it('prevents a duplicate save if the medicine was created but refreshing fails', async () => {
  const create = jest.spyOn(healthApi, 'createMedication').mockResolvedValue(medication);
  const close = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider>
      <MedicationForm memberId="member" memberName="Divya" onClose={close} onCreated={jest.fn().mockRejectedValue(new Error('Offline'))} />
    </AppThemeProvider>);
  });
  await act(async () => {
    renderer.root.findAllByType(TextInput).find(item => item.props.accessibilityLabel === 'Medicine name & strength')!.props.onChangeText('Medicine');
    renderer.root.findAllByType(TextInput).find(item => item.props.accessibilityLabel === 'Dose')!.props.onChangeText('10 mg');
  });
  await act(async () => { renderer.root.findAllByType(Button).find(item => item.props.title === 'Save')!.props.onPress(); });
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children))
    .toContain('Medicine saved, but Health could not be refreshed: Offline');
  const saved = renderer.root.findAllByType(Button).find(item => item.props.title === 'Saved')!;
  expect(saved.props.disabled).toBe(true);
  await act(async () => { saved.props.onPress(); });
  expect(create).toHaveBeenCalledTimes(1);
  await act(async () => { renderer.root.findAllByType(Button).find(item => item.props.title === 'Close')!.props.onPress(); });
  expect(close).toHaveBeenCalledTimes(1);
});
