import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import type { HealthExtraction } from '../../../api/healthExtraction';
import { AppText } from '../../../components/primitives/AppText';
import { AppThemeProvider } from '../../../design/theme/ThemeProvider';
import { HealthField } from './HealthForms';
import { PrescriptionReviewSheet } from './PrescriptionReviewSheet';

const extraction: HealthExtraction = {
  documentType: 'prescription',
  patient: { name: 'Patient', dateOfBirth: '1990-01-01' },
  doctor: 'Dr One',
  medications: [{ name: 'Original', dose: '5 mg', frequency: 'daily', duration: '5 days', quantity: '5' }],
  measurements: [{ name: 'Weight', value: 60, unit: 'kg' }],
  followUps: [{ title: 'Follow up', explicitDate: '2026-12-01' }],
  prescriptionAnalysis: { isHandwritten: true, hasUnreadableMedicationText: false, outcome: 'medications_detected' },
};

async function render(onSave: jest.Mock, initial = extraction, onClose = jest.fn()) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider>
      <PrescriptionReviewSheet extraction={initial} onSave={onSave} onClose={onClose} />
    </AppThemeProvider>);
  });
  return renderer;
}

it('prefills AI values and sends edits while preserving other clinical data', async () => {
  const onSave = jest.fn().mockResolvedValue(undefined);
  const renderer = await render(onSave);
  const field = (label: string) => renderer.root.findAllByType(HealthField).find(item => item.props.label === label)!;
  expect(field('Medicine name').props.value).toBe('Original');
  expect(field('Dose').props.value).toBe('5 mg');
  await act(async () => {
    field('Medicine name').props.onChangeText('Corrected');
    field('Dose').props.onChangeText('10 mg');
    field('Patient name').props.onChangeText('Correct Patient');
    field('Follow-up 1').props.onChangeText('Review appointment');
    field('Reading 1 value').props.onChangeText('65');
  });
  await act(async () => { renderer.root.findByProps({ title: 'Confirm and save' }).props.onPress(); });
  expect(onSave).toHaveBeenCalledWith({
    extraction: expect.objectContaining({
      patient: expect.objectContaining({ name: 'Correct Patient', dateOfBirth: '1990-01-01' }),
      medications: [expect.objectContaining({ name: 'Corrected', dose: '10 mg', frequency: 'daily' })],
      measurements: [expect.objectContaining({ name: 'Weight', value: 65, unit: 'kg' })],
      followUps: [expect.objectContaining({ title: 'Review appointment' })],
      prescriptionAnalysis: extraction.prescriptionAnalysis,
    }),
  });
});

it('allows adding and removing medicines and validates names before save', async () => {
  const onSave = jest.fn();
  const renderer = await render(onSave, { ...extraction, medications: [] });
  await act(async () => { renderer.root.findByProps({ title: 'Add medicine' }).props.onPress(); });
  await act(async () => { renderer.root.findByProps({ title: 'Confirm and save' }).props.onPress(); });
  expect(onSave).not.toHaveBeenCalled();
  expect(renderer.root.findAllByType(AppText).some(item => item.props.children === 'Enter a name for each medicine or remove the empty medicine.')).toBe(true);
  await act(async () => { renderer.root.findByProps({ title: 'Remove medicine 1' }).props.onPress(); });
  await act(async () => { renderer.root.findByProps({ title: 'Confirm and save' }).props.onPress(); });
  expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ extraction: expect.objectContaining({ medications: [] }) }));
});

it('keeps edits open and displays save errors', async () => {
  const renderer = await render(jest.fn().mockRejectedValue(new Error('Network failed')));
  await act(async () => { renderer.root.findByProps({ title: 'Confirm and save' }).props.onPress(); });
  expect(renderer.root.findAllByType(AppText).some(item => item.props.children === 'Network failed')).toBe(true);
  expect(renderer.root.findAllByType(HealthField).find(item => item.props.label === 'Medicine name')?.props.value).toBe('Original');
});

it('cancels without saving', async () => {
  const onSave = jest.fn();
  const onClose = jest.fn();
  const renderer = await render(onSave, extraction, onClose);
  await act(async () => { renderer.root.findByProps({ title: 'Cancel upload' }).props.onPress(); });
  expect(onClose).toHaveBeenCalled();
  expect(onSave).not.toHaveBeenCalled();
});
