import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.readiness.auth-access-token';

export const sessionStorage = {
  async readAccessToken() {
    const value = await Keychain.getGenericPassword({ service: SERVICE });
    return value ? value.password : null;
  },
  async writeAccessToken(token: string) {
    await Keychain.setGenericPassword('readiness', token, {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async clear() {
    await Keychain.resetGenericPassword({ service: SERVICE });
  },
};
