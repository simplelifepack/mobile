import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Alert, NativeModules, Platform, Share, TextInput } from 'react-native';
import { FileSystem } from 'react-native-file-access';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { healthApi, type HealthMember, type HealthRecord } from '../../../api/health.api';
import { documentsApi } from '../../../api/documents.api';
import { Button } from '../../../components/primitives/Button';
import { DatePickerInput } from '../../../components/primitives/DatePickerInput';
import { AppText } from '../../../components/primitives/AppText';
import { AppThemeProvider } from '../../../design/theme/ThemeProvider';
import * as visitPack from '../visitPack';
import { VisitPackSheet } from './VisitPackSheet';

const member: HealthMember = { id: 'm1', name: 'Divya', relation: 'self', createdAt: '', updatedAt: '' };
const records: HealthRecord[] = [
  { id: 'r1', memberId: 'm1', documentId: 'd1', type: 'prescription', doctor: 'Dr Rao', documentDate: '2026-11-01', processingStatus: 'processed', createdAt: '2026-11-01', measurementCount: 0, trackedMeasurementCount: 0, medicationCount: 0, followUpCount: 0 },
  { id: 'r2', memberId: 'm1', documentId: 'd2', type: 'lab_report', doctor: 'Dr Other', documentDate: '2026-10-01', processingStatus: 'processed', createdAt: '2026-10-01', measurementCount: 0, trackedMeasurementCount: 0, medicationCount: 0, followUpCount: 0 },
];

afterEach(() => jest.restoreAllMocks());

it('selects a doctor, date and records without claiming a medical cover sheet', async () => {
  jest.spyOn(healthApi, 'records').mockResolvedValue(records);
  jest.spyOn(documentsApi, 'list').mockResolvedValue([]);
  const zip = jest.spyOn(visitPack, 'buildVisitPackZip').mockResolvedValue({ path: '/tmp/visit.zip', fileName: 'visit.zip' });
  jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction, activityType: undefined });
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider><VisitPackSheet member={member} visible onClose={jest.fn()} /></AppThemeProvider>);
  });
  expect(renderer.root.findByType(SafeAreaProvider).findAllByType(SafeAreaView)).toHaveLength(1);
  const button = (title: string) => renderer.root.findAllByType(Button).find(item => item.props.title === title)!;
  expect(button('Choose documents').props.disabled).toBe(true);
  const radio = renderer.root.findAllByProps({ accessibilityLabel: 'Dr Rao' }).find(item => item.props.accessibilityRole === 'radio')!;
  await act(async () => {
    radio.props.onPress();
    renderer.root.findByType(DatePickerInput).props.onChangeText('2026-11-15');
  });
  expect(button('Choose documents').props.disabled).toBe(false);
  await act(async () => { button('Choose documents').props.onPress(); });
  const press = (label: string) => renderer.root.findAllByProps({ accessibilityLabel: label }).find(item => typeof item.props.onPress === 'function')!;
  expect(press('Select Prescription').props.accessibilityState.checked).toBe(true);
  expect(renderer.root.findAllByProps({ accessibilityLabel: 'Select Lab report' })).toHaveLength(0);
  await act(async () => { press('Add more documents').props.onPress(); });
  expect(press('Select Lab report').props.accessibilityState.checked).toBe(false);
  const filter = (label: string) => renderer.root.findAllByProps({ accessibilityRole: 'button' }).find(item =>
    typeof item.props.onPress === 'function' && item.findAllByType(AppText).some(text => text.props.children === label),
  )!;
  await act(async () => { filter('Lab reports').props.onPress(); });
  expect(press('Select Prescription').props.accessibilityState.checked).toBe(true);
  await act(async () => { press('Select Lab report').props.onPress(); });
  await act(async () => { filter('All records').props.onPress(); });
  expect(press('Select Lab report').props.accessibilityState.checked).toBe(true);
  await act(async () => { press('Select Lab report').props.onPress(); });
  await act(async () => { button('Review').props.onPress(); });
  const labels = renderer.root.findAllByType(AppText).map(item => item.props.children);
  expect(labels).toContain('Your visit packet');
  expect(labels).toContain('1 document · ZIP');
  expect(labels).not.toContain('Next appointment: Dr Rao on 01 Nov 2026.');
  expect(button('Save packet (unavailable)').props.disabled).toBe(true);
  await act(async () => { filter('Change').props.onPress(); });
  expect(press('Select Prescription').props.accessibilityState.checked).toBe(true);
  await act(async () => { button('Review').props.onPress(); });
  await act(async () => { button('Prepare ZIP').props.onPress(); });
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children)).toContain('Ready to take along');
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children)).toContain('visit.zip');
  await act(async () => { press('Share via another app').props.onPress(); });
  expect(zip).toHaveBeenCalledWith(
    [expect.objectContaining({ record: records[0] })], 'Divya', 'Dr Rao', '2026-11-15', undefined,
  );
  expect(Share.share).toHaveBeenCalledWith({ title: 'visit.zip', url: 'file:///tmp/visit.zip' });
  await act(async () => { press('Back to packet review').props.onPress(); });
  expect(FileSystem.unlink).toHaveBeenCalledWith('/tmp/visit.zip');
});

it('offers recent records for an entered doctor and preserves selection controls', async () => {
  jest.spyOn(healthApi, 'records').mockResolvedValue(records);
  jest.spyOn(documentsApi, 'list').mockResolvedValue([]);
  const zip = jest.spyOn(visitPack, 'buildVisitPackZip').mockResolvedValue({ path: '/tmp/visit.zip', fileName: 'visit.zip' });
  jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction, activityType: undefined });
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider><VisitPackSheet member={member} visible onClose={jest.fn()} /></AppThemeProvider>);
  });
  const findPress = (label: string) => renderer.root.findAllByProps({ accessibilityLabel: label }).find(item => typeof item.props.onPress === 'function')!;
  const button = (title: string) => renderer.root.findAllByType(Button).find(item => item.props.title === title)!;
  await act(async () => { findPress('Add another doctor').props.onPress(); });
  expect(button('Choose documents').props.disabled).toBe(true);
  await act(async () => {
    renderer.root.findAllByType(TextInput).find(item => item.props.accessibilityLabel === "Doctor's name")!.props.onChangeText('Dr New');
    renderer.root.findAllByType(TextInput).find(item => item.props.accessibilityLabel === 'Clinic (optional)')!.props.onChangeText('City Clinic');
  });
  await act(async () => { button('Choose documents').props.onPress(); });
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children))
    .toContain('Recent records are preselected; they may not be related to this doctor.');
  await act(async () => { findPress('Select Lab report').props.onPress(); });
  await act(async () => { button('Review').props.onPress(); });
  await act(async () => { button('Prepare ZIP').props.onPress(); });
  await act(async () => { findPress('Save to Files').props.onPress(); });
  expect(zip).toHaveBeenCalledWith([expect.objectContaining({ record: records[0] })], 'Divya', 'Dr New', undefined, 'City Clinic');
  await act(async () => { findPress('Back to packet review').props.onPress(); });
  await act(async () => { findPress('Back to document selection').props.onPress(); });
  await act(async () => { findPress('Back to doctor selection').props.onPress(); });
  expect(renderer.root.findAllByType(TextInput).find(item => item.props.accessibilityLabel === "Doctor's name")!.props.value).toBe('Dr New');
});

it('shares a ZIP on Android and reports failures without claiming success', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  const shareZip = jest.fn().mockRejectedValueOnce(new Error('Share failed')).mockResolvedValueOnce(undefined);
  NativeModules.VisitPackShare = { shareZip };
  jest.spyOn(healthApi, 'records').mockResolvedValue(records);
  jest.spyOn(documentsApi, 'list').mockResolvedValue([]);
  jest.spyOn(visitPack, 'buildVisitPackZip').mockResolvedValue({ path: '/tmp/visit.zip', fileName: 'visit.zip' });
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider><VisitPackSheet member={member} visible onClose={jest.fn()} /></AppThemeProvider>);
  });
  const button = (title: string) => renderer.root.findAllByType(Button).find(item => item.props.title === title)!;
  await act(async () => { renderer.root.findAllByProps({ accessibilityLabel: 'Dr Rao' }).find(item => item.props.accessibilityRole === 'radio')!.props.onPress(); });
  await act(async () => { button('Choose documents').props.onPress(); });
  await act(async () => { button('Review').props.onPress(); });
  await act(async () => { button('Prepare ZIP').props.onPress(); });
  const press = (label: string) => renderer.root.findAllByProps({ accessibilityLabel: label }).find(item => typeof item.props.onPress === 'function')!;
  await act(async () => { press('Share via another app').props.onPress(); });
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children)).toContain('Share failed');
  await act(async () => { press('Share via another app').props.onPress(); });
  expect(shareZip).toHaveBeenCalledWith('/tmp/visit.zip', 'visit.zip');
  await act(async () => { press('Save to Downloads').props.onPress(); });
  expect(FileSystem.cpExternal).toHaveBeenCalledWith('/tmp/visit.zip', 'visit.zip', 'downloads');
  await act(async () => { renderer.unmount(); });
  expect(FileSystem.unlink).toHaveBeenCalledWith('/tmp/visit.zip');
  delete NativeModules.VisitPackShare;
});

it('requires at least one selected record before review and preserves selections when going back', async () => {
  jest.spyOn(healthApi, 'records').mockResolvedValue(records);
  jest.spyOn(documentsApi, 'list').mockResolvedValue([]);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider><VisitPackSheet member={member} visible onClose={jest.fn()} /></AppThemeProvider>);
  });
  const press = (label: string) => renderer.root.findAllByProps({ accessibilityLabel: label }).find(item => typeof item.props.onPress === 'function')!;
  const button = (title: string) => renderer.root.findAllByType(Button).find(item => item.props.title === title)!;
  await act(async () => { press('Dr Rao').props.onPress(); });
  await act(async () => { button('Choose documents').props.onPress(); });
  await act(async () => { press('Select Prescription').props.onPress(); });
  expect(button('Review').props.disabled).toBe(true);
  await act(async () => { button('Back').props.onPress(); });
  await act(async () => { press('Dr Rao').props.onPress(); button('Choose documents').props.onPress(); });
  expect(button('Review').props.disabled).toBe(true);
});

it('keeps the review screen on preparation failure and retries successfully', async () => {
  jest.spyOn(healthApi, 'records').mockResolvedValue(records);
  jest.spyOn(documentsApi, 'list').mockResolvedValue([]);
  const zip = jest.spyOn(visitPack, 'buildVisitPackZip')
    .mockRejectedValueOnce(new Error('Document unavailable'))
    .mockResolvedValueOnce({ path: '/tmp/visit.zip', fileName: 'visit.zip' });
  const share = jest.spyOn(Share, 'share');
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider><VisitPackSheet member={member} visible onClose={jest.fn()} /></AppThemeProvider>);
  });
  const button = (title: string) => renderer.root.findAllByType(Button).find(item => item.props.title === title)!;
  await act(async () => { renderer.root.findAllByProps({ accessibilityLabel: 'Dr Rao' }).find(item => item.props.accessibilityRole === 'radio')!.props.onPress(); });
  await act(async () => { button('Choose documents').props.onPress(); });
  await act(async () => { button('Review').props.onPress(); });
  await act(async () => { button('Prepare ZIP').props.onPress(); });
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children)).toContain('Document unavailable');
  await act(async () => { button('Prepare ZIP').props.onPress(); });
  expect(zip).toHaveBeenCalledTimes(2);
  expect(share).not.toHaveBeenCalled();
  expect(renderer.root.findAllByProps({ accessibilityLabel: 'Preview ZIP unavailable' })[0].props.accessibilityState.disabled).toBe(true);
  await act(async () => { renderer.unmount(); });
});

it('cleans up a packet prepared after the screen closes without showing ready', async () => {
  jest.spyOn(healthApi, 'records').mockResolvedValue(records);
  jest.spyOn(documentsApi, 'list').mockResolvedValue([]);
  let resolveZip!: (value: { path: string; fileName: string }) => void;
  const zip = jest.spyOn(visitPack, 'buildVisitPackZip').mockImplementation(() => new Promise(resolve => { resolveZip = resolve; }));
  const unlink = jest.spyOn(FileSystem, 'unlink').mockResolvedValue(undefined);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  const sheet = (visible: boolean) => <AppThemeProvider><VisitPackSheet member={member} visible={visible} onClose={jest.fn()} /></AppThemeProvider>;
  await act(async () => { renderer = ReactTestRenderer.create(sheet(true)); });
  const button = (title: string) => renderer.root.findAllByType(Button).find(item => item.props.title === title)!;
  await act(async () => { renderer.root.findAllByProps({ accessibilityLabel: 'Dr Rao' }).find(item => item.props.accessibilityRole === 'radio')!.props.onPress(); });
  await act(async () => { button('Choose documents').props.onPress(); });
  await act(async () => { button('Review').props.onPress(); });
  await act(async () => { button('Prepare ZIP').props.onPress(); });
  expect(button('Preparing ZIP…').props.disabled).toBe(true);
  await act(async () => { renderer.update(sheet(false)); });
  await act(async () => { resolveZip({ path: '/tmp/late.zip', fileName: 'late.zip' }); });
  expect(unlink).toHaveBeenCalledWith('/tmp/late.zip');
  expect(zip).toHaveBeenCalledTimes(1);
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children)).not.toContain('Ready to take along');
  await act(async () => { renderer.unmount(); });
});

it('does not claim an iOS save when the share sheet is dismissed', async () => {
  jest.spyOn(healthApi, 'records').mockResolvedValue(records);
  jest.spyOn(documentsApi, 'list').mockResolvedValue([]);
  jest.spyOn(visitPack, 'buildVisitPackZip').mockResolvedValue({ path: '/tmp/visit.zip', fileName: 'visit.zip' });
  jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.dismissedAction, activityType: undefined });
  const alert = jest.spyOn(Alert, 'alert');
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider><VisitPackSheet member={member} visible onClose={jest.fn()} /></AppThemeProvider>);
  });
  const button = (title: string) => renderer.root.findAllByType(Button).find(item => item.props.title === title)!;
  await act(async () => { renderer.root.findAllByProps({ accessibilityLabel: 'Dr Rao' }).find(item => item.props.accessibilityRole === 'radio')!.props.onPress(); });
  await act(async () => { button('Choose documents').props.onPress(); });
  await act(async () => { button('Review').props.onPress(); });
  await act(async () => { button('Prepare ZIP').props.onPress(); });
  await act(async () => { renderer.root.findAllByProps({ accessibilityLabel: 'Save to Files' }).find(item => typeof item.props.onPress === 'function')!.props.onPress(); });
  expect(alert).not.toHaveBeenCalled();
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children)).toContain('Ready to take along');
  await act(async () => { renderer.unmount(); });
});

it('shows load errors and can retry', async () => {
  const load = jest.spyOn(healthApi, 'records').mockRejectedValueOnce(new Error('Offline')).mockResolvedValue(records);
  jest.spyOn(documentsApi, 'list').mockResolvedValue([]);
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<AppThemeProvider><VisitPackSheet member={member} visible onClose={jest.fn()} /></AppThemeProvider>);
  });
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children)).toContain('Offline');
  const retry = renderer.root.findAllByProps({ accessibilityRole: 'button' }).find(item =>
    typeof item.props.onPress === 'function' && item.findAllByType(AppText).some(text => text.props.children === 'Retry'),
  )!;
  await act(async () => { retry.props.onPress(); });
  expect(load).toHaveBeenCalledTimes(2);
  expect(renderer.root.findAllByType(AppText).map(item => item.props.children)).toContain('Dr Rao');
});
