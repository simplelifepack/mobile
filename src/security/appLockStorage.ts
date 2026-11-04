import * as Keychain from 'react-native-keychain';
import { NativeModules, Platform } from 'react-native';
export type LockSettings = { enabled: boolean; biometrics: boolean };
const settingsService = (id: string) =>
  `com.readines.app-lock.settings.${encodeURIComponent(id)}`;
const biometricService = (id: string) =>
  `com.readines.app-lock.biometric.${encodeURIComponent(id)}`;
const prompt = { title: 'Unlock Readines', cancel: 'Use R-pin' };
async function freshAndroidBiometry() {
  if (Platform.OS !== 'android') return;
  if (!NativeModules.ReadinessFiles?.authenticateBiometry)
    throw new Error(
      'Rebuild the app to enable biometric verification. Use your R-pin.',
    );
  if ((await NativeModules.ReadinessFiles.authenticateBiometry()) !== true)
    throw new Error('Biometric verification did not complete. Use your R-pin.');
}
async function readBiometricGate(id: string) {
  const verified = await Keychain.getGenericPassword({
    service: biometricService(id),
    authenticationPrompt: prompt,
  });
  if (!verified || verified.username !== id || verified.password !== id)
    throw new Error('Not verified');
}

export const appLockStorage = {
  async read(id: string): Promise<LockSettings> {
    const saved = await Keychain.getGenericPassword({
      service: settingsService(id),
    });
    if (!saved) return { enabled: false, biometrics: false };
    const value = JSON.parse(saved.password);
    if (
      saved.username !== id ||
      typeof value.enabled !== 'boolean' ||
      typeof value.biometrics !== 'boolean'
    )
      throw new Error(
        'Unable to read app-lock settings. Unlock with your R-pin.',
      );
    return {
      enabled: value.enabled,
      biometrics: value.enabled && value.biometrics,
    };
  },
  async save(id: string, settings: LockSettings) {
    const normalized = {
      enabled: settings.enabled,
      biometrics: settings.enabled && settings.biometrics,
    };
    const saved = await Keychain.setGenericPassword(
      id,
      JSON.stringify(normalized),
      {
        service: settingsService(id),
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      },
    );
    if (!saved) throw new Error('Unable to save app-lock settings. Try again.');
    if (!normalized.biometrics)
      await Keychain.resetGenericPassword({
        service: biometricService(id),
      }).catch(() => undefined);
    return normalized;
  },
  supportedBiometry: () => Keychain.getSupportedBiometryType(),
  async enableBiometry(id: string) {
    if (!(await Keychain.getSupportedBiometryType()))
      throw new Error(
        'Set up Face ID, Touch ID or fingerprint recognition in device Settings first.',
      );
    await freshAndroidBiometry();
    const saved = await Keychain.setGenericPassword(id, id, {
      service: biometricService(id),
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
      authenticationPrompt: prompt,
    });
    if (!saved) throw new Error('Unable to enable biometric unlocking.');
    try {
      await readBiometricGate(id);
    } catch {
      await Keychain.resetGenericPassword({
        service: biometricService(id),
      }).catch(() => undefined);
      throw new Error(
        'Biometric verification was cancelled or is unavailable. Use your R-pin, or try again.',
      );
    }
  },
  async authenticate(id: string) {
    try {
      await freshAndroidBiometry();
      await readBiometricGate(id);
    } catch {
      throw new Error(
        'Biometric verification was cancelled or is unavailable. Use your R-pin, or try again.',
      );
    }
  },
};
