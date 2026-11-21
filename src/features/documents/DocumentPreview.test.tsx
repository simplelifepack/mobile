import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Image, Linking } from 'react-native';
import { FileSystem } from 'react-native-file-access';
import { documentsApi } from '../../api/documents.api';
import type { DocumentRecord } from '../../api/types';
import { AppText } from '../../components/primitives/AppText';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { DocumentPreview } from './DocumentPreview';

const document: DocumentRecord = {
  id: 'document-1', originalName: 'report.pdf', mimeType: 'application/pdf',
  documentType: 'Lab Report', classificationStatus: 'detected', ownershipStatus: 'unknown',
  confidence: 90, createdAt: '2026-01-01',
};
const page = (id: string, mimeType: string) => ({
  id, mimeType, originalName: `${id}.png`, position: 0, label: id, sourceType: 'upload',
  size: 10, createdAt: '2026-01-01', updatedAt: '2026-01-01',
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

async function render(initialDocument?: DocumentRecord) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <DocumentPreview documentId={document.id} initialDocument={initialDocument} onClose={jest.fn()} />
      </AppThemeProvider>,
    );
  });
  return renderer;
}

it('loads the Health record document by id and cleans up its preview on close', async () => {
  const metadata = jest.spyOn(documentsApi, 'getById').mockResolvedValue(document);
  const preview = jest.spyOn(documentsApi, 'preview').mockResolvedValue({ path: '/tmp/report.pdf', fileName: 'report.pdf' });
  const renderer = await render();
  expect(metadata).toHaveBeenCalledWith('document-1');
  expect(preview).toHaveBeenCalledWith('document-1', 'application/pdf');
  expect(renderer.root.findAllByType(AppText).some(item => item.props.children === 'report.pdf')).toBe(true);
  await act(async () => { renderer.unmount(); });
  expect(FileSystem.unlink).toHaveBeenCalledWith('/tmp/report.pdf');
});

it('shows image pages and cleans up the previous page when navigating', async () => {
  const pages = [page('one', 'image/png'), page('two', 'image/jpeg')];
  const preview = jest.spyOn(documentsApi, 'previewPage')
    .mockResolvedValueOnce({ path: '/tmp/one.png', fileName: 'one.png' })
    .mockResolvedValueOnce({ path: '/tmp/two.jpg', fileName: 'two.jpg' });
  const renderer = await render({ ...document, pages });
  expect(renderer.root.findByType(Image).props.source.uri).toBe('file:///tmp/one.png');
  await act(async () => { renderer.root.findByProps({ accessibilityLabel: 'Next document page' }).props.onPress(); });
  expect(preview).toHaveBeenLastCalledWith('document-1', 'two', 'image/jpeg');
  expect(renderer.root.findByType(Image).props.source.uri).toBe('file:///tmp/two.jpg');
  expect(FileSystem.unlink).toHaveBeenCalledWith('/tmp/one.png');
  await act(async () => { renderer.unmount(); });
  expect(FileSystem.unlink).toHaveBeenCalledWith('/tmp/two.jpg');
});

it('cleans up a download that finishes after the preview closes', async () => {
  let finish!: (file: { path: string; fileName: string }) => void;
  jest.spyOn(documentsApi, 'preview').mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const renderer = await render(document);
  await act(async () => { renderer.unmount(); });
  await act(async () => { finish({ path: '/tmp/late.pdf', fileName: 'late.pdf' }); });
  expect(FileSystem.unlink).toHaveBeenCalledWith('/tmp/late.pdf');
});

it('shows a metadata error rather than displaying a blank preview', async () => {
  jest.spyOn(documentsApi, 'getById').mockRejectedValue(new Error('Document not found.'));
  const renderer = await render();
  expect(renderer.root.findAllByType(AppText).some(item => item.props.children === 'Document not found.')).toBe(true);
});

it('shows a download error without displaying an empty preview', async () => {
  jest.spyOn(documentsApi, 'preview').mockRejectedValue(new Error('Preview unavailable.'));
  const renderer = await render(document);
  expect(renderer.root.findAllByType(AppText).some(item => item.props.children === 'Preview unavailable.')).toBe(true);
});

it('offers the original Google Drive link without downloading a preview', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  const preview = jest.spyOn(documentsApi, 'preview');
  const renderer = await render({ ...document, source: 'GOOGLE_DRIVE', openUrl: 'https://drive.google.com/file' });
  await act(async () => {
    renderer.root.findAllByProps({ accessibilityRole: 'button' }).find(item =>
      item.findAllByType(AppText).some(text => text.props.children === 'Open original in Google Drive'),
    )!.props.onPress();
  });
  expect(open).toHaveBeenCalledWith('https://drive.google.com/file');
  expect(preview).not.toHaveBeenCalled();
});
