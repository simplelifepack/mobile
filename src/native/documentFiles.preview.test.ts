import { NativeModules, Platform, Share } from 'react-native';
import { previewDownload } from './documentFiles';
const file = {
  path: '/private/cache/document.pdf',
  fileName: 'statement.pdf',
  mimeType: 'application/pdf',
};
const originalOS = Platform.OS;
const originalFiles = NativeModules.ReadinessFiles;
afterEach(() => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: originalOS,
  });
  NativeModules.ReadinessFiles = originalFiles;
  jest.restoreAllMocks();
});
it('previews on iOS without opening the share sheet', async () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  const preview = jest.fn().mockResolvedValue(undefined);
  NativeModules.ReadinessFiles = { preview };
  const share = jest.spyOn(Share, 'share').mockResolvedValue({
    action: Share.dismissedAction,
    activityType: undefined,
  });
  await previewDownload(file);
  expect(preview).toHaveBeenCalledWith(file.path, file.mimeType, file.fileName);
  expect(share).not.toHaveBeenCalled();
});
it('previews on Android without opening another app', async () => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: 'android',
  });
  const preview = jest.fn().mockResolvedValue(undefined);
  const open = jest.fn();
  NativeModules.ReadinessFiles = { preview, open };
  await previewDownload(file);
  expect(preview).toHaveBeenCalledWith(file.path, file.mimeType, file.fileName);
  expect(open).not.toHaveBeenCalled();
});
it('does not silently export a preview on older binaries', async () => {
  NativeModules.ReadinessFiles = {};
  const share = jest.spyOn(Share, 'share');
  await expect(previewDownload(file)).rejects.toThrow('Update Readines');
  expect(share).not.toHaveBeenCalled();
});
