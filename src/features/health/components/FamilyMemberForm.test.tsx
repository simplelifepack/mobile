import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { TextInput } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { HealthMember } from '../../../api/health.api';
import { AppText } from '../../../components/primitives/AppText';
import { Button } from '../../../components/primitives/Button';
import { DatePickerInput } from '../../../components/primitives/DatePickerInput';
import { AppThemeProvider } from '../../../design/theme/ThemeProvider';
import { FamilyMemberForm } from './FamilyMemberForm';

const member: HealthMember = {
  id: 'm', name: 'Padma', relation: 'Mother', dateOfBirth: '1963-03-18',
  bloodGroup: 'A+', allergies: 'Penicillin', conditions: 'Asthma',
  emergencyContactName: 'Divya', emergencyContactPhone: '123', createdAt: '', updatedAt: '',
};

async function create(save: jest.Mock, initial?: HealthMember, initialName?: string) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  const close = jest.fn();
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider><FamilyMemberForm member={initial} initialName={initialName} onClose={close} onSave={save} /></AppThemeProvider>);
  });
  return {
    renderer, close,
    input: (label: string) => renderer.root.findAllByType(TextInput).find(item => item.props.accessibilityLabel === label)!,
    press: (label: string) => renderer.root.findAllByProps({ accessibilityLabel: label }).find(item => typeof item.props.onPress === 'function')!,
    button: (label: string) => renderer.root.findAllByType(Button).find(item => item.props.title === label)!,
    text: () => renderer.root.findAllByType(AppText).map(item => item.props.children),
  };
}

it('creates a profile with supported details and marks unsupported fields unavailable', async () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const ui = await create(save, undefined, 'Padma');
  expect(ui.renderer.root.findByType(SafeAreaProvider).findAllByType(SafeAreaView)).toHaveLength(1);
  expect(ui.renderer.root.findByProps({ accessibilityLabel: 'Sex: Unavailable' }).props.accessibilityState.disabled).toBe(true);
  expect(ui.renderer.root.findByProps({ accessibilityLabel: 'Relationship: Unavailable' }).props.accessibilityState.disabled).toBe(true);
  expect(ui.input('Full name').props.value).toBe('Padma');
  await act(async () => { ui.press('Relationship').props.onPress(); });
  await act(async () => { ui.press('Relationship: Mother').props.onPress(); ui.press('Blood group').props.onPress(); });
  await act(async () => {
    ui.press('Blood group: A+').props.onPress();
    ui.renderer.root.findByType(DatePickerInput).props.onChangeText('1963-03-18');
    ui.input('Allergies').props.onChangeText(' Penicillin ');
    ui.input('Medical information').props.onChangeText(' Asthma ');
    ui.input('Name').props.onChangeText(' Divya ');
    ui.input('Phone number').props.onChangeText(' 123 ');
  });
  await act(async () => { ui.button('Create profile').props.onPress(); });
  expect(save).toHaveBeenCalledWith({
    name: 'Padma', relation: 'Mother', dateOfBirth: '1963-03-18', bloodGroup: 'A+',
    allergies: 'Penicillin', conditions: 'Asthma', emergencyContactName: 'Divya', emergencyContactPhone: '123',
  });
});

it('edits real profile values without overwriting fields not shown', async () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const ui = await create(save, member);
  expect(ui.input('Allergies').props.value).toBe('Penicillin');
  expect(ui.input('Medical information').props.value).toBe('Asthma');
  await act(async () => {
    ui.input('Full name').props.onChangeText(' Padma Rao ');
    ui.input('Name').props.onChangeText('');
  });
  await act(async () => { ui.button('Save').props.onPress(); });
  expect(save).toHaveBeenCalledWith({
    name: 'Padma Rao', relation: 'Mother', dateOfBirth: '1963-03-18', bloodGroup: 'A+',
    allergies: 'Penicillin', conditions: 'Asthma', emergencyContactName: null, emergencyContactPhone: '123',
  });
});

it('validates input, protects the default relationship and reports save failures', async () => {
  const save = jest.fn().mockRejectedValue(new Error('Offline'));
  const ui = await create(save, { ...member, relation: 'Myself' });
  expect(ui.press('Relationship').props.disabled).toBe(true);
  await act(async () => { ui.input('Full name').props.onChangeText(''); });
  await act(async () => { ui.button('Save').props.onPress(); });
  expect(ui.text()).toContain('Name and relationship are required.');
  await act(async () => {
    ui.input('Full name').props.onChangeText('Me');
    ui.renderer.root.findByType(DatePickerInput).props.onChangeText('9999-01-01');
  });
  await act(async () => { ui.button('Save').props.onPress(); });
  expect(ui.text()).toContain('Enter a valid date of birth that is not in the future.');
  await act(async () => { ui.renderer.root.findByType(DatePickerInput).props.onChangeText(''); });
  await act(async () => { ui.button('Save').props.onPress(); });
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ relation: 'Myself', dateOfBirth: null }));
  expect(ui.text()).toContain('Offline');
  expect(ui.close).not.toHaveBeenCalled();
});

it('prevents duplicate submissions and changes while saving', async () => {
  let finish!: () => void;
  const save = jest.fn().mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
  const ui = await create(save, member);
  await act(async () => {
    const handler = ui.button('Save').props.onPress;
    handler();
    handler();
  });
  expect(save).toHaveBeenCalledTimes(1);
  expect(ui.button('Saving…').props.disabled).toBe(true);
  expect(ui.input('Full name').props.editable).toBe(false);
  expect(ui.renderer.root.findByType(DatePickerInput).props.disabled).toBe(true);
  expect(ui.press('Relationship').props.disabled).toBe(true);
  await act(async () => { finish(); });
});

it('preserves an existing Other relationship', async () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const ui = await create(save, { ...member, relation: 'Other' });
  await act(async () => { ui.button('Save').props.onPress(); });
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ relation: 'Other' }));
});
