import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import type { HealthMember } from '../../../api/health.api';
import { AppText } from '../../../components/primitives/AppText';
import { Button } from '../../../components/primitives/Button';
import { AppThemeProvider } from '../../../design/theme/ThemeProvider';
import { EditCareProfileSheet } from './EditCareProfileSheet';
import { HealthField } from './HealthForms';
import { MedicalReadiness } from './HealthPanels';

const member: HealthMember = {
  id: 'member-1',
  name: 'Arjun',
  relation: 'Self',
  bloodGroup: 'O+',
  conditions: 'Asthma',
  allergies: 'Penicillin',
  primaryDoctor: 'Dr Meera',
  preferredHospital: 'General Hospital',
  emergencyContactName: 'Divya',
  emergencyContactPhone: '123',
  insuranceProvider: 'Insurer',
  insurancePolicyNumber: 'ABC',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
};

async function render(onSave: jest.Mock, initialMember = member, members: HealthMember[] = []) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <EditCareProfileSheet member={initialMember} members={members} onClose={jest.fn()} onSave={onSave} />
      </AppThemeProvider>,
    );
  });
  return renderer;
}

it('saves edited profile fields and retains the other existing values', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const renderer = await render(onSave);
  await act(async () => {
    renderer.root.findAllByType(HealthField).find(field => field.props.label === 'Primary doctor')!
      .props.onChangeText(' Dr Rao ');
    renderer.root.findAllByType(HealthField).find(field => field.props.label === 'Phone')!
      .props.onChangeText('');
    renderer.root.findAllByType(HealthField).find(field => field.props.label === 'Preferred hospital')!
      .props.onChangeText(' City Hospital ');
  });
  await act(async () => {
    renderer.root.findByType(Button).props.onPress();
  });
  expect(onSave).toHaveBeenCalledWith({
    bloodGroup: 'O+',
    conditions: 'Asthma',
    allergies: 'Penicillin',
    primaryDoctor: 'Dr Rao',
    preferredHospital: 'City Hospital',
    emergencyContactName: 'Divya',
    emergencyContactPhone: '',
    insuranceProvider: 'Insurer',
    insurancePolicyNumber: 'ABC',
  });
});

it('saves explicit no-known choices without losing an edited value when toggled back', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const renderer = await render(onSave);
  const checkbox = (label: string) => renderer.root.findByProps({
    accessibilityRole: 'checkbox',
    accessibilityLabel: label,
  });
  await act(async () => {
    checkbox('No known conditions').props.onPress();
    checkbox('No known allergies').props.onPress();
  });
  expect(renderer.root.findAllByType(HealthField).find(field => field.props.label === 'Conditions')!.props.editable).toBe(false);
  await act(async () => {
    checkbox('No known conditions').props.onPress();
  });
  expect(renderer.root.findByProps({ accessibilityLabel: 'Remove condition Asthma' })).toBeDefined();
  await act(async () => {
    renderer.root.findByType(Button).props.onPress();
  });
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
    conditions: 'Asthma',
    allergies: 'No known allergies',
  }));
});

it('adds and removes conditions and includes the unsubmitted condition when saving', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const renderer = await render(onSave);
  const conditionField = () => renderer.root.findAllByType(HealthField).find(field => field.props.label === 'Conditions')!;
  await act(async () => { conditionField().props.onChangeText('Diabetes'); });
  await act(async () => { renderer.root.findByProps({ accessibilityLabel: 'Add condition' }).props.onPress(); });
  await act(async () => {
    renderer.root.findByProps({ accessibilityLabel: 'Remove condition Asthma' }).props.onPress();
    conditionField().props.onChangeText('Migraine');
  });
  await act(async () => { renderer.root.findByType(Button).props.onPress(); });
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ conditions: 'Diabetes, Migraine' }));
});

it('selects a family contact without carrying over the previous contact phone', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const relative = { ...member, id: 'member-2', name: 'Ramesh' };
  const renderer = await render(onSave, member, [member, relative]);
  await act(async () => {
    renderer.root.findByProps({ accessibilityLabel: 'Select Ramesh as emergency contact' }).props.onPress();
  });
  await act(async () => { renderer.root.findByType(Button).props.onPress(); });
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
    emergencyContactName: 'Ramesh',
    emergencyContactPhone: '',
  }));
});

it('displays the API error and keeps the form open', async () => {
  const onSave = jest.fn().mockRejectedValue(new Error('Update failed'));
  const renderer = await render(onSave);
  await act(async () => {
    renderer.root.findByType(Button).props.onPress();
  });
  expect(renderer.root.findAllByType(AppText).some(text => text.props.children === 'Update failed')).toBe(true);
  expect(renderer.root.findByType(Button).props.disabled).toBe(false);
});

it('opens editing for the selected member from the medical readiness card', async () => {
  const onEdit = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <MedicalReadiness member={member} records={[]} onEdit={onEdit} />
      </AppThemeProvider>,
    );
  });
  expect(renderer.root.findByProps({
    accessibilityRole: 'progressbar',
  }).props.accessibilityValue.now).toBe(83);
  await act(async () => {
    renderer.root.findByProps({
      accessibilityLabel: "Edit Arjun's medical profile",
      accessibilityRole: 'button',
    }).props.onPress();
  });
  expect(onEdit).toHaveBeenCalledTimes(1);
});
