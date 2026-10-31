import * as Keychain from 'react-native-keychain';

const servicePrefix = 'com.readiness.digilocker-session';
const serviceFor = (userId: string) => `${servicePrefix}.${userId}`;

// Scoped per account so one user's session id can never be read by another.
export const pendingSession = {
  async read(userId: string) {
    const value = await Keychain.getGenericPassword({ service: serviceFor(userId) });
    return value ? value.password : null;
  },
  async write(userId: string, sessionId: string) {
    await Keychain.setGenericPassword('digilocker', sessionId, {
      service: serviceFor(userId),
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async clear(userId: string) {
    await Keychain.resetGenericPassword({ service: serviceFor(userId) });
  },
};
