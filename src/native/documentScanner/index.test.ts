import { NativeModules } from 'react-native';
const scan = jest.fn();
const supported = jest.fn();
beforeEach(() => {
  jest.resetModules();
  scan.mockReset();
  supported.mockReset();
  NativeModules.ReadinessDocumentScanner = { scan, isSupported: supported };
});
afterEach(() => {
  delete NativeModules.ReadinessDocumentScanner;
});
it('preserves native camera/simulator guidance rather than replacing it with a generic unsupported error', async () => {
  scan.mockRejectedValue(
    new Error('Live scanning needs a physical iPhone camera.'),
  );
  const { DocumentScanner } = require('./index');
  await expect(
    DocumentScanner.scan({ pageLimit: 50, allowGalleryImport: true }),
  ).rejects.toThrow('physical iPhone');
  expect(scan).toHaveBeenCalledWith({
    pageLimit: 50,
    allowGalleryImport: true,
  });
});
it('returns corrected native pages in order and treats cancellation as no pages', async () => {
  const result = {
    pages: [1, 2].map(pageNumber => ({
      pageNumber,
      localPath: `/private/corrected-${pageNumber}.jpg`,
      mimeType: 'image/jpeg',
    })),
  };
  scan.mockResolvedValueOnce(result).mockResolvedValueOnce({ pages: [] });
  const { DocumentScanner } = require('./index');
  await expect(DocumentScanner.scan()).resolves.toEqual(result);
  await expect(DocumentScanner.scan()).resolves.toEqual({ pages: [] });
});
it('requires a rebuilt native scanner instead of falling back to an ordinary camera', async () => {
  delete NativeModules.ReadinessDocumentScanner;
  const { DocumentScanner } = require('./index');
  await expect(DocumentScanner.isSupported()).resolves.toBe(false);
  await expect(DocumentScanner.scan()).rejects.toThrow('not linked');
});

it('retries native permission state after denial and after access is revoked', async () => {
  const denied = Object.assign(new Error('Camera denied'), {
    code: 'CAMERA_PERMISSION',
  });
  scan
    .mockRejectedValueOnce(denied)
    .mockResolvedValueOnce({ pages: [] })
    .mockRejectedValueOnce(denied);
  const { DocumentScanner } = require('./index');
  await expect(DocumentScanner.scan()).rejects.toMatchObject({
    code: 'CAMERA_PERMISSION',
  });
  await expect(DocumentScanner.scan()).resolves.toEqual({ pages: [] });
  await expect(DocumentScanner.scan()).rejects.toMatchObject({
    code: 'CAMERA_PERMISSION',
  });
  expect(scan).toHaveBeenCalledTimes(3);
  expect(supported).not.toHaveBeenCalled();
});
