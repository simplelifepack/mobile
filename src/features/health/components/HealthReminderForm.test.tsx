import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { TextInput } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../../components/primitives/AppText';
import { Button } from '../../../components/primitives/Button';
import { DatePickerInput } from '../../../components/primitives/DatePickerInput';
import { AppThemeProvider } from '../../../design/theme/ThemeProvider';
import { HealthReminderForm } from './HealthReminderForm';

const create = async (onSave: jest.Mock, onClose = jest.fn()) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider><HealthReminderForm memberName="Divya" onClose={onClose} onSave={onSave} /></AppThemeProvider>);
  });
  const press = (label: string) => renderer.root.findAllByProps({ accessibilityLabel: label }).find(item => typeof item.props.onPress === 'function')!;
  const button = (label: string) => renderer.root.findAllByType(Button).find(item => item.props.title === label)!;
  const text = () => renderer.root.findAllByType(AppText).map(item => item.props.children);
  return { renderer, press, button, text, onClose };
};

it('shows unsupported fields and saves supported details without claiming notifications are enabled', async () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const ui = await create(save);
  expect(ui.renderer.root.findByType(SafeAreaProvider).findAllByType(SafeAreaView)).toHaveLength(1);
  expect(ui.renderer.root.findByProps({ accessibilityLabel: 'Reminder type: Reading unavailable' }).props.accessibilityState.disabled).toBe(true);
  await act(async () => { ui.press('Reminder type: Medicine').props.onPress(); });
  expect(ui.renderer.root.findByProps({ accessibilityLabel: 'Linked medicine: Unavailable' }).props.accessibilityState.disabled).toBe(true);
  await act(async () => {
    ui.renderer.root.findAllByType(TextInput).find(item => item.props.accessibilityLabel === 'Reminder title')!.props.onChangeText('  Take vitamin  ');
    ui.renderer.root.findAllByType(TextInput).find(item => item.props.accessibilityLabel === 'Reminder time')!.props.onChangeText('14:30');
    ui.renderer.root.findByType(DatePickerInput).props.onChangeText('11/15/2026');
    ui.press('Repeat: Every week').props.onPress();
  });
  await act(async () => { ui.button('Save reminder').props.onPress(); });
  expect(save).toHaveBeenCalledWith({ title: 'Take vitamin', type: 'medicine', dueDate: '2026-11-15', frequency: 'weekly', time: '14:30' });
  expect(ui.text()).toEqual(expect.arrayContaining(['Reminder saved', 'Take vitamin', '15 Nov 2026', 'Every week']));
  expect(ui.text()).not.toContain('Notifications are on.');
  expect(ui.button('Edit reminder (unavailable)').props.disabled).toBe(true);
  await act(async () => { ui.button('Done').props.onPress(); });
  expect(ui.onClose).toHaveBeenCalledTimes(1);
});

it('validates required fields and displays save errors without showing success', async () => {
  const save = jest.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(undefined);
  const ui = await create(save);
  await act(async () => { ui.button('Save reminder').props.onPress(); });
  expect(save).not.toHaveBeenCalled();
  expect(ui.text()).toContain('Reminder type, title, start date and repeat are required.');
  await act(async () => {
    ui.press('Reminder type: Appointment').props.onPress();
    ui.renderer.root.findAllByType(TextInput).find(item => item.props.accessibilityLabel === 'Reminder title')!.props.onChangeText('Checkup');
    ui.renderer.root.findByType(DatePickerInput).props.onChangeText('02/30/2026');
    ui.press('Repeat: Once').props.onPress();
  });
  await act(async () => { ui.button('Save reminder').props.onPress(); });
  expect(ui.text()).toContain('Enter a valid start date.');
  await act(async () => { ui.renderer.root.findByType(DatePickerInput).props.onChangeText('12/01/2036'); });
  await act(async () => { ui.button('Save reminder').props.onPress(); });
  expect(ui.text()).toContain('Offline');
  expect(ui.text()).not.toContain('Reminder saved');
  await act(async () => { ui.button('Save reminder').props.onPress(); });
  expect(ui.text()).toContain('Reminder saved');
});

it('prevents duplicate submissions while saving', async () => {
  let finish!: () => void;
  const save = jest.fn().mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
  const ui = await create(save);
  await act(async () => {
    ui.press('Reminder type: Refill').props.onPress();
    ui.renderer.root.findAllByType(TextInput).find(item => item.props.accessibilityLabel === 'Reminder title')!.props.onChangeText('Refill');
    ui.renderer.root.findByType(DatePickerInput).props.onChangeText('12/01/2036');
    ui.press('Repeat: Once').props.onPress();
  });
  await act(async () => {
    const handler = ui.button('Save reminder').props.onPress;
    handler();
    handler();
  });
  expect(save).toHaveBeenCalledTimes(1);
  expect(ui.button('Saving…').props.disabled).toBe(true);
  await act(async () => { finish(); });
  expect(ui.text()).toContain('Reminder saved');
});
