import { NativeModules, Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';
import { appLockStorage } from './appLockStorage';
jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only' },
  ACCESS_CONTROL: { BIOMETRY_CURRENT_SET: 'current-biometrics' },
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  getSupportedBiometryType: jest.fn(),
}));
beforeEach(() => {
  jest.resetAllMocks();
  (Keychain.setGenericPassword as jest.Mock).mockResolvedValue({
    service: 'saved',
  });
  (Keychain.resetGenericPassword as jest.Mock).mockResolvedValue(true);
  (Keychain.getSupportedBiometryType as jest.Mock).mockResolvedValue('FaceID');
});
it('defaults to disabled only when no setting exists and persists per-account device settings', async () => {
  (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);
  expect(await appLockStorage.read('a')).toEqual({
    enabled: false,
    biometrics: false,
  });
  await appLockStorage.save('a', { enabled: true, biometrics: false });
  expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
    'a',
    JSON.stringify({ enabled: true, biometrics: false }),
    expect.objectContaining({
      service: 'com.readines.app-lock.settings.a',
      accessible: 'device-only',
    }),
  );
  await appLockStorage.read('b');
  expect(Keychain.getGenericPassword).toHaveBeenLastCalledWith({
    service: 'com.readines.app-lock.settings.b',
  });
});
it.each(['invalid json', JSON.stringify({ enabled: 'yes', biometrics: true })])(
  'does not silently disable protection for malformed settings: %s',
  async password => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
      username: 'a',
      password,
    });
    await expect(appLockStorage.read('a')).rejects.toThrow();
  },
);
it('protects a biometric gate with the current enrollment and verifies it before enabling', async () => {
  (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
    username: 'a',
    password: 'a',
  });
  await appLockStorage.enableBiometry('a');
  expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
    'a',
    'a',
    expect.objectContaining({
      service: 'com.readines.app-lock.biometric.a',
      accessControl: 'current-biometrics',
    }),
  );
  expect(Keychain.getGenericPassword).toHaveBeenCalledWith(
    expect.objectContaining({ service: 'com.readines.app-lock.biometric.a' }),
  );
});
it('does not enable unsupported biometrics', async () => {
  (Keychain.getSupportedBiometryType as jest.Mock).mockResolvedValue(null);
  await expect(appLockStorage.enableBiometry('a')).rejects.toThrow('Set up');
  expect(Keychain.setGenericPassword).not.toHaveBeenCalled();
});
it.each([
  false,
  { username: 'b', password: 'b' },
  { username: 'a', password: 'wrong' },
])(
  'never treats a missing or wrong-account credential as biometric success: %p',
  async credential => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(credential);
    await expect(appLockStorage.authenticate('a')).rejects.toThrow('R-pin');
  },
);
it('keeps the R-pin fallback on cancellation and cleans up failed biometric enrollment', async () => {
  (Keychain.getGenericPassword as jest.Mock).mockRejectedValue(
    new Error('user cancelled'),
  );
  await expect(appLockStorage.enableBiometry('a')).rejects.toThrow('R-pin');
  expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
    service: 'com.readines.app-lock.biometric.a',
  });
});

afterEach(() => jest.restoreAllMocks());
it('requires a fresh Android native prompt on every biometric unlock', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  NativeModules.ReadinessFiles = {
    authenticateBiometry: jest.fn().mockResolvedValue(true),
  };
  (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
    username: 'a',
    password: 'a',
  });
  await appLockStorage.authenticate('a');
  await appLockStorage.authenticate('a');
  expect(
    NativeModules.ReadinessFiles.authenticateBiometry,
  ).toHaveBeenCalledTimes(2);
});
it.each([false, 'cancel'])(
  'rejects an incomplete Android prompt before reading the gate: %s',
  async result => {
    jest.replaceProperty(Platform, 'OS', 'android');
    NativeModules.ReadinessFiles = {
      authenticateBiometry:
        result === 'cancel'
          ? jest.fn().mockRejectedValue(new Error('cancelled'))
          : jest.fn().mockResolvedValue(result),
    };
    await expect(appLockStorage.authenticate('a')).rejects.toThrow('R-pin');
    expect(Keychain.getGenericPassword).not.toHaveBeenCalled();
  },
);
