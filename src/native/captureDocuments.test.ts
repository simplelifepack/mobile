import { captureDocuments } from './captureDocuments';
import { DocumentScanner } from './documentScanner';
import { FileSystem } from 'react-native-file-access';
import { handleScannerPermissionError } from './documentScanner/permission';
jest.mock('./documentScanner', () => ({
  DocumentScanner: { scan: jest.fn() },
}));
jest.mock('./documentScanner/permission', () => ({
  handleScannerPermissionError: jest.fn(),
}));
it('returns captured pages in the same format as file uploads', async () => {
  jest
    .mocked(DocumentScanner.scan)
    .mockResolvedValue({
      pages: [
        { pageNumber: 1, localPath: '/tmp/scan.jpg', mimeType: 'image/jpeg' },
      ],
    });
  jest.mocked(FileSystem.stat).mockResolvedValue({ size: 512 } as never);
  expect(await captureDocuments()).toEqual([
    {
      uri: 'file:///tmp/scan.jpg',
      name: 'scan-1.jpg',
      type: 'image/jpeg',
      size: 512,
    },
  ]);
});
it('allows cancellation or a handled camera permission error without an upload', async () => {
  jest.mocked(DocumentScanner.scan).mockResolvedValue({ pages: [] });
  expect(await captureDocuments()).toEqual([]);
  jest
    .mocked(DocumentScanner.scan)
    .mockRejectedValue({ code: 'CAMERA_PERMISSION' });
  jest.mocked(handleScannerPermissionError).mockReturnValue(true);
  expect(await captureDocuments()).toEqual([]);
});
