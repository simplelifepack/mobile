import * as Keychain from 'react-native-keychain';
const SERVICES = {
  pinVerifier: 'com.readiness.pin-verifier',
  encryptionKey: 'com.readiness.document-key',
} as const;
export interface PinDerivationProvider {
  deriveVerifier(pin: string): Promise<string>;
  verify(pin: string, verifier: string): Promise<boolean>;
}
export const secureVault = {
  async storePinVerifier(verifier: string) {
    return Keychain.setGenericPassword('readiness', verifier, {
      service: SERVICES.pinVerifier,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async readPinVerifier() {
    const value = await Keychain.getGenericPassword({
      service: SERVICES.pinVerifier,
    });
    return value ? value.password : null;
  },
  async storeDocumentKey(keyMaterial: string) {
    return Keychain.setGenericPassword('readiness', keyMaterial, {
      service: SERVICES.encryptionKey,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async unlockWithBiometrics() {
    return Keychain.getGenericPassword({
      service: SERVICES.encryptionKey,
      accessControl:
        Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE,
      authenticationPrompt: { title: 'Unlock Readiness' },
    });
  },
};
