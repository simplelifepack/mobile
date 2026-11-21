import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { TextInput } from 'react-native';
import type { HealthRecord } from '../../../api/health.api';
import type { DocumentRecord } from '../../../api/types';
import { AppText } from '../../../components/primitives/AppText';
import { AppThemeProvider } from '../../../design/theme/ThemeProvider';
import { HealthRecords } from './HealthRecords';

const records: HealthRecord[] = [
  { id: 'lab', memberId: 'm', documentId: 'lab-doc', type: 'lab_report', provider: 'City lab', documentDate: '2026-01-02', processingStatus: 'processed', createdAt: '2026-01-02', measurementCount: 0, trackedMeasurementCount: 0, medicationCount: 0, followUpCount: 0 },
  { id: 'rx', memberId: 'm', documentId: 'rx-doc', type: 'prescription', doctor: 'Dr Rao', documentDate: '2026-02-02', processingStatus: 'handwritten_unreadable', createdAt: '2026-02-02', measurementCount: 0, trackedMeasurementCount: 0, medicationCount: 0, followUpCount: 0 },
];
const documents: DocumentRecord[] = [{
  id: 'lab-doc', title: 'Blood test', originalName: 'lab.pdf', documentType: 'lab_report',
  classificationStatus: 'detected', ownershipStatus: 'verified', confidence: 1, createdAt: '2026-01-02',
}];

it('searches and filters records, previews the selected original and uploads', async () => {
  const preview = jest.fn();
  const upload = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider>
      <HealthRecords records={records} documents={documents} onUpload={upload} onPreview={preview} />
    </AppThemeProvider>);
  });
  const buttons = () => renderer.root.findAllByProps({ accessibilityRole: 'button' }).filter(item => typeof item.props.onPress === 'function');
  const button = (text: string) => buttons().find(item =>
    item.findAllByType(AppText).some(label => label.props.children === text),
  )!;
  const labels = () => renderer.root.findAllByType(AppText).map(item => item.props.children);
  expect(labels()).toContain('Blood test');
  expect(labels()).toContain('Prescription');
  expect(labels()).toContain('Handwritten unreadable');
  expect(button('All').props.accessibilityState.selected).toBe(true);

  await act(async () => { button('Lab reports').props.onPress(); });
  expect(button('Lab reports').props.accessibilityState.selected).toBe(true);
  expect(labels()).toContain('Blood test');
  expect(labels()).not.toContain('Prescription');
  await act(async () => { renderer.root.findByType(TextInput).props.onChangeText('city'); });
  expect(labels()).toContain('Blood test');
  await act(async () => { renderer.root.findByType(TextInput).props.onChangeText('unknown'); });
  expect(labels()).toContain('No records match your search or filter.');
  await act(async () => {
    renderer.root.findByType(TextInput).props.onChangeText('lab.pdf');
  });
  await act(async () => {
    buttons().find(item => item.props.accessibilityLabel === 'View original document: Blood test')!.props.onPress();
    button('Add record').props.onPress();
  });
  expect(preview).toHaveBeenCalledWith('lab-doc');
  expect(upload).toHaveBeenCalledTimes(1);
});

it('distinguishes unavailable records from an empty list', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider>
      <HealthRecords onUpload={jest.fn()} onPreview={jest.fn()} />
    </AppThemeProvider>);
  });
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children))
    .toContain('Records unavailable. Pull to refresh.');
  await act(async () => {
    renderer.update(<AppThemeProvider><HealthRecords records={[]} onUpload={jest.fn()} onPreview={jest.fn()} /></AppThemeProvider>);
  });
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children))
    .toContain('No health records yet. Add a medical record to get started.');
});
