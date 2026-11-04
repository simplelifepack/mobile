import * as Keychain from 'react-native-keychain';
const service = (owner: string) =>
  `com.readines.digilocker.${encodeURIComponent(owner)}`;
export const digiLockerSessionStorage = {
  async read(owner: string) {
    const saved = await Keychain.getGenericPassword({
      service: service(owner),
    });
    if (!saved || saved.username !== owner) return null;
    if (!saved.password.startsWith('{')) return { id: saved.password };
    const value = JSON.parse(saved.password) as {
      id?: unknown;
      authorizationUrl?: unknown;
    };
    if (typeof value.id !== 'string') return null;
    return {
      id: value.id,
      authorizationUrl:
        typeof value.authorizationUrl === 'string'
          ? value.authorizationUrl
          : undefined,
    };
  },
  async save(owner: string, id: string, authorizationUrl?: string) {
    const saved = await Keychain.setGenericPassword(
      owner,
      JSON.stringify({ id, authorizationUrl }),
      {
        service: service(owner),
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      },
    );
    if (!saved)
      throw new Error('Unable to save DigiLocker session. Please retry.');
  },
  async clear(owner: string) {
    await Keychain.resetGenericPassword({ service: service(owner) });
  },
};
