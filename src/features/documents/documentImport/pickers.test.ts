import { keepLocalCopy, pick, type DocumentPickerResponse } from '@react-native-documents/picker';
import { FileSystem } from 'react-native-file-access';
import { launchImageLibrary } from 'react-native-image-picker';
import { selectDocumentFiles, selectImageFromGallery, selectImagesFromGallery } from './pickers';

const mockPick = jest.mocked(pick);
const mockKeepLocalCopy = jest.mocked(keepLocalCopy);
const mockImageLibrary = jest.mocked(launchImageLibrary);
const picked = (uri: string, name: string): DocumentPickerResponse => ({
  uri, name, type: 'application/pdf', error: null, nativeType: null, size: null,
  isVirtual: false, convertibleToMimeTypes: null, hasRequestedType: true,
});

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

async function select() {
  const result = selectDocumentFiles();
  await jest.advanceTimersByTimeAsync(450);
  return result;
}

it('selects separate files and preserves their names despite duplicate filenames', async () => {
  mockPick.mockResolvedValue([
    picked('content://first', 'report.pdf'),
    picked('content://second', 'report.pdf'),
  ]);
  mockKeepLocalCopy.mockResolvedValue([
    { status: 'success', localUri: 'file:///cache/first', sourceUri: 'content://first' },
    { status: 'success', localUri: 'file:///cache/second', sourceUri: 'content://second' },
  ]);
  const files = await select();
  expect(files).toEqual([
    { path: '/cache/first', fileName: 'report.pdf', mimeType: 'application/pdf' },
    { path: '/cache/second', fileName: 'report.pdf', mimeType: 'application/pdf' },
  ]);
  expect(mockPick).toHaveBeenCalledWith(expect.objectContaining({ allowMultiSelection: true }));
  const copyFiles = mockKeepLocalCopy.mock.calls[0][0].files;
  expect(copyFiles[0].fileName).not.toBe(copyFiles[1].fileName);
});

it('cleans up successfully copied files if another copy fails', async () => {
  mockPick.mockResolvedValue([
    picked('content://first', 'a.pdf'),
    picked('content://second', 'b.pdf'),
  ]);
  mockKeepLocalCopy.mockResolvedValue([
    { status: 'success', localUri: 'file:///cache/first', sourceUri: 'content://first' },
    { status: 'error', copyError: 'Copy failed', sourceUri: 'content://second' },
  ]);
  const result = selectDocumentFiles();
  const assertion = result.catch(error => error);
  await jest.advanceTimersByTimeAsync(450);
  expect(await assertion).toEqual(new Error('Copy failed'));
  expect(FileSystem.unlink).toHaveBeenCalledWith('/cache/first');
});

it('handles picker cancellation without attempting to copy', async () => {
  mockPick.mockRejectedValue({ code: 'OPERATION_CANCELED' });
  await expect(select()).resolves.toBeUndefined();
  expect(mockKeepLocalCopy).not.toHaveBeenCalled();
});

it('selects multiple gallery images as separate documents', async () => {
  mockImageLibrary.mockResolvedValue({
    assets: [
      { uri: 'file:///cache/first.jpg', fileName: 'first.jpg', type: 'image/jpeg' },
      { uri: 'file:///cache/second.png', fileName: 'second.png', type: 'image/png' },
    ],
  });
  const result = selectImagesFromGallery();
  await jest.advanceTimersByTimeAsync(450);
  expect(await result).toEqual([
    { path: '/cache/first.jpg', fileName: 'first.jpg', mimeType: 'image/jpeg' },
    { path: '/cache/second.png', fileName: 'second.png', mimeType: 'image/png' },
  ]);
  expect(mockImageLibrary).toHaveBeenCalledWith(expect.objectContaining({ selectionLimit: 0 }));
});

it('handles gallery cancellation and reports picker errors', async () => {
  mockImageLibrary.mockResolvedValueOnce({ didCancel: true }).mockResolvedValueOnce({
    errorCode: 'others', errorMessage: 'Gallery unavailable',
  });
  const cancelled = selectImagesFromGallery();
  await jest.advanceTimersByTimeAsync(450);
  await expect(cancelled).resolves.toBeUndefined();
  const failed = selectImagesFromGallery();
  const error = failed.catch(reason => reason);
  await jest.advanceTimersByTimeAsync(450);
  expect(await error).toEqual(new Error('Gallery unavailable'));
});

it('cleans up selected gallery copies when a returned asset is invalid', async () => {
  mockImageLibrary.mockResolvedValue({
    assets: [
      { uri: 'file:///cache/first.jpg', fileName: 'first.jpg', type: 'image/jpeg' },
      { uri: 'file:///cache/second.heic', fileName: 'second.heic', type: 'image/heic' },
    ],
  });
  const result = selectImagesFromGallery();
  const error = result.catch(reason => reason);
  await jest.advanceTimersByTimeAsync(450);
  expect(await error).toEqual(new Error('Choose a PDF, JPEG, PNG, or WebP document.'));
  expect(FileSystem.unlink).toHaveBeenCalledWith('/cache/first.jpg');
  expect(FileSystem.unlink).toHaveBeenCalledWith('/cache/second.heic');
});

it('keeps the existing single-image picker for other screens', async () => {
  mockImageLibrary.mockResolvedValue({
    assets: [{ uri: 'file:///cache/first.jpg', fileName: 'first.jpg', type: 'image/jpeg' }],
  });
  const result = selectImageFromGallery();
  await jest.advanceTimersByTimeAsync(450);
  expect(await result).toEqual({ path: '/cache/first.jpg', fileName: 'first.jpg', mimeType: 'image/jpeg' });
  expect(mockImageLibrary).toHaveBeenCalledWith(expect.objectContaining({ selectionLimit: 1 }));
});
