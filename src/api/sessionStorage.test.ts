import * as Keychain from 'react-native-keychain';
import { sessionStorage } from './sessionStorage';
jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'unlocked' },
  setGenericPassword: jest.fn().mockResolvedValue(true),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
  getGenericPassword: jest.fn().mockResolvedValue(false),
}));
it('serializes token writes and logout so a slow older write cannot resurrect a session', async () => {
  let finish!: (value: boolean) => void;
  (Keychain.setGenericPassword as jest.Mock).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      }),
  );
  const old = sessionStorage.writeAccessToken('old');
  const newer = sessionStorage.writeAccessToken('new');
  const clear = sessionStorage.clear();
  await Promise.resolve();
  expect(Keychain.setGenericPassword).toHaveBeenCalledTimes(1);
  expect(Keychain.resetGenericPassword).not.toHaveBeenCalled();
  finish(true);
  await Promise.all([old, newer, clear]);
  expect(
    (Keychain.setGenericPassword as jest.Mock).mock.calls.map(call => call[1]),
  ).toEqual(['old', 'new']);
  expect(Keychain.resetGenericPassword).toHaveBeenCalledTimes(1);
});
