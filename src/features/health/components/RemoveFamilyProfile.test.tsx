import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Alert, Platform, Share } from 'react-native';
import { FileSystem } from 'react-native-file-access';
import { healthApi, type HealthMember, type HealthRecord } from '../../../api/health.api';
import { documentsApi } from '../../../api/documents.api';
import { AppText } from '../../../components/primitives/AppText';
import { Button } from '../../../components/primitives/Button';
import { AppThemeProvider } from '../../../design/theme/ThemeProvider';
import * as visitPack from '../visitPack';
import { RemoveFamilyProfile } from './RemoveFamilyProfile';

const member: HealthMember = { id: 'm', name: 'Padma', relation: 'Mother', createdAt: '', updatedAt: '' };
const record: HealthRecord = { id: 'r', memberId: 'm', documentId: 'd', type: 'lab_report', documentDate: null, processingStatus: 'processed', createdAt: '', measurementCount: 0, trackedMeasurementCount: 0, medicationCount: 0, followUpCount: 0 };
afterEach(() => jest.restoreAllMocks());

async function create(onRemove = jest.fn().mockResolvedValue(undefined)) {
  const onClose = jest.fn();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => { renderer = ReactTestRenderer.create(<AppThemeProvider><RemoveFamilyProfile member={member} onClose={onClose} onRemove={onRemove} /></AppThemeProvider>); });
  return {
    renderer, onRemove, onClose,
    press: (label: string) => renderer.root.findAllByProps({ accessibilityLabel: label }).find(item => typeof item.props.onPress === 'function')!,
    text: () => renderer.root.findAllByType(AppText).map(item => item.props.children),
  };
}

it('explains deletion and supports cancellation', async () => {
  const ui = await create();
  expect(ui.text()).toContain('Profile, readings, tracked tests, medicines, follow-ups, reminders and the documents linked to its health records');
  expect(ui.text()).toContain('This cannot be undone. The record documents are also deleted from Documents. Download them first if you need a copy; the ZIP contains documents only, not readings or other profile data.');
  await act(async () => { ui.renderer.root.findByType(Button).props.onPress(); });
  expect(ui.onClose).toHaveBeenCalledTimes(1);
  expect(ui.onRemove).not.toHaveBeenCalled();
});

it('prevents duplicate deletion and displays server failure', async () => {
  let reject!: (error: Error) => void;
  const remove = jest.fn().mockImplementation(() => new Promise<void>((_, fail) => { reject = fail; }));
  const ui = await create(remove);
  await act(async () => { const handler = ui.press('Delete profile').props.onPress; handler(); handler(); });
  expect(remove).toHaveBeenCalledTimes(1);
  expect(ui.press('Back').props.disabled).toBe(true);
  await act(async () => { reject(new Error('Offline')); });
  expect(ui.text()).toContain('Offline');
  expect(ui.onClose).not.toHaveBeenCalled();
});

it('exports the target member documents and cleans the temporary ZIP', async () => {
  jest.spyOn(healthApi, 'records').mockResolvedValue([record]);
  jest.spyOn(documentsApi, 'list').mockResolvedValue([]);
  const build = jest.spyOn(visitPack, 'buildMemberRecordsZip').mockResolvedValue({ path: '/tmp/records.zip', fileName: 'records.zip' });
  const unlink = jest.spyOn(FileSystem, 'unlink').mockResolvedValue(undefined);
  const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction, activityType: undefined });
  const copy = jest.spyOn(FileSystem, 'cpExternal').mockResolvedValue(undefined);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const ui = await create();
  await act(async () => { ui.press('Download record documents').props.onPress(); });
  expect(healthApi.records).toHaveBeenCalledWith('m');
  expect(build).toHaveBeenCalledWith([{ record, document: undefined }], 'Padma');
  if (Platform.OS === 'android') expect(copy).toHaveBeenCalledWith('/tmp/records.zip', 'records.zip', 'downloads');
  else expect(share).toHaveBeenCalledWith({ title: 'records.zip', url: 'file:///tmp/records.zip' });
  expect(unlink).toHaveBeenCalledWith('/tmp/records.zip');
  expect(ui.onRemove).not.toHaveBeenCalled();
});

it('reports when there are no record documents', async () => {
  jest.spyOn(healthApi, 'records').mockResolvedValue([]);
  jest.spyOn(documentsApi, 'list').mockResolvedValue([]);
  const ui = await create();
  await act(async () => { ui.press('Download record documents').props.onPress(); });
  expect(ui.text()).toContain('There are no health record documents to download for this profile.');
});
