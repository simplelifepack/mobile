import { Alert, Linking } from 'react-native';
import { handleScannerPermissionError } from './permission';

const alert = jest.spyOn(Alert, 'alert');
const settings = jest.spyOn(Linking, 'openSettings');
beforeEach(() => {
  alert.mockReset();
  settings.mockReset().mockResolvedValue(undefined);
});
afterAll(() => jest.restoreAllMocks());

it('offers Settings after denial without attempting another permission request', async () => {
  expect(handleScannerPermissionError({ code: 'CAMERA_PERMISSION' })).toBe(
    true,
  );
  const buttons = alert.mock.calls[0][2]!;
  expect(buttons[0]).toMatchObject({ text: 'Not now', style: 'cancel' });
  expect(settings).not.toHaveBeenCalled();
  buttons[1].onPress?.();
  expect(settings).toHaveBeenCalledTimes(1);
});

it('explains managed restrictions without offering an ineffective Settings retry', () => {
  expect(handleScannerPermissionError({ code: 'CAMERA_RESTRICTED' })).toBe(
    true,
  );
  expect(alert.mock.calls[0][2]).toEqual([{ text: 'OK' }]);
  expect(settings).not.toHaveBeenCalled();
});

it('provides manual recovery when Settings cannot open', async () => {
  settings.mockRejectedValueOnce(new Error('unavailable'));
  handleScannerPermissionError({ code: 'CAMERA_PERMISSION' });
  alert.mock.calls[0][2]![1].onPress?.();
  await Promise.resolve();
  expect(alert).toHaveBeenLastCalledWith(
    'Open Settings manually',
    expect.stringContaining('enable Camera'),
  );
});

it.each([
  null,
  undefined,
  {},
  { code: 'SCAN_FAILED' },
  { code: 'SCANNER_UNSUPPORTED' },
])('keeps other scanner failures in the normal error flow: %p', error => {
  expect(handleScannerPermissionError(error)).toBe(false);
  expect(alert).not.toHaveBeenCalled();
});
