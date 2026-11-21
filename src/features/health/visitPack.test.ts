import JSZip from 'jszip';
import { FileSystem } from 'react-native-file-access';
import { documentsApi } from '../../api/documents.api';
import type { HealthRecord } from '../../api/health.api';
import { buildMemberRecordsZip, buildVisitPackZip, visitItemDetail, visitSummary } from './visitPack';

afterEach(() => jest.restoreAllMocks());

it('writes selected documents and explicit visit details into the ZIP', async () => {
  const record: HealthRecord = {
    id: 'r1', memberId: 'm1', documentId: 'd1', type: 'prescription', documentDate: '2026-10-01',
    processingStatus: 'processed', createdAt: '2026-10-01', measurementCount: 0,
    trackedMeasurementCount: 0, medicationCount: 0, followUpCount: 0,
  };
  jest.spyOn(documentsApi, 'preview').mockResolvedValue({ path: '/tmp/document.pdf', fileName: 'document.pdf' });
  jest.spyOn(FileSystem, 'readFile').mockResolvedValue('SGVsbG8=');
  const write = jest.spyOn(FileSystem, 'writeFile').mockResolvedValue(undefined);
  const first = await buildVisitPackZip([{ record }, { record: { ...record, id: 'r2', documentId: 'd2' } }], 'Divya', 'Dr New', '2026-11-15', 'City Clinic');
  const archive = await JSZip.loadAsync(write.mock.calls[write.mock.calls.length - 1][1], { base64: true });
  expect(await archive.file('visit-details.txt')!.async('string')).toBe('Profile: Divya\nSelection: Dr New\nClinic: City Clinic\nVisit date: 2026-11-15');
  expect(await archive.file('2026-10-01/Prescription')!.async('string')).toBe('Hello');
  expect(await archive.file('2026-10-01/Prescription_2')!.async('string')).toBe('Hello');
  expect(visitSummary([{ record }])).not.toContain('visit');
  expect(visitItemDetail({ record: { ...record, provider: 'City Clinic' } })).toBe('Prescription · 01 Oct 2026 · City Clinic');
  expect(first.path.endsWith(`/${first.fileName}`)).toBe(true);
  const second = await buildVisitPackZip([{ record }], 'Divya', 'Dr New');
  expect(second.path).not.toBe(first.path);
});

it('exports member records with a document-only manifest', async () => {
  const record: HealthRecord = {
    id: 'r', memberId: 'm', documentId: 'd', type: 'lab_report', documentDate: null,
    processingStatus: 'processed', createdAt: '', measurementCount: 0,
    trackedMeasurementCount: 0, medicationCount: 0, followUpCount: 0,
  };
  jest.spyOn(documentsApi, 'preview').mockResolvedValue({ path: '/tmp/document.pdf', fileName: 'document.pdf' });
  jest.spyOn(FileSystem, 'readFile').mockResolvedValue('SGVsbG8=');
  const write = jest.spyOn(FileSystem, 'writeFile').mockResolvedValue(undefined);
  const result = await buildMemberRecordsZip([{ record }], 'Padma');
  const archive = await JSZip.loadAsync(write.mock.calls[write.mock.calls.length - 1][1], { base64: true });
  expect(await archive.file('records-details.txt')!.async('string')).toContain('record documents only');
  expect(await archive.file('undated/Lab_report')!.async('string')).toBe('Hello');
  expect(result.fileName).toContain('Health-Records');
});
