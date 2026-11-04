import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.readiness.auth-access-token';
let pendingWrite = Promise.resolve();
function serialize<T>(work: () => Promise<T>): Promise<T> {
  const result = pendingWrite.then(work);
  pendingWrite = result.then(() => undefined, () => undefined);
  return result;
}

export const sessionStorage = {
  async readAccessToken() {
    await pendingWrite;
    const value = await Keychain.getGenericPassword({ service: SERVICE });
    return value ? value.password : null;
  },
  async writeAccessToken(token: string) {
    await serialize(() => Keychain.setGenericPassword('readiness', token, {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }));
  },
  async clear() {
    await serialize(() => Keychain.resetGenericPassword({ service: SERVICE }));
  },
};
