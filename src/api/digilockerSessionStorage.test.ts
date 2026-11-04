import * as Keychain from 'react-native-keychain';
import { digiLockerSessionStorage } from './digilockerSessionStorage';
jest.mock('react-native-keychain', () => ({
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only' },
}));
const keychain = jest.mocked(Keychain);
beforeEach(() => jest.clearAllMocks());
it('recovers the sign-in URL for the same owner and remains compatible with older pending sessions', async () => {
  keychain.getGenericPassword.mockResolvedValueOnce({
    username: 'owner',
    password: 'legacy-id',
    service: 'test',
    storage: '',
  } as never);
  expect(await digiLockerSessionStorage.read('owner')).toEqual({
    id: 'legacy-id',
  });
  keychain.getGenericPassword.mockResolvedValueOnce({
    username: 'owner',
    password: JSON.stringify({
      id: 'session',
      authorizationUrl:
        'https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize?state=opaque',
    }),
  } as never);
  expect(await digiLockerSessionStorage.read('owner')).toEqual({
    id: 'session',
    authorizationUrl: expect.stringContaining(
      'https://digilocker.meripehchaan.gov.in/',
    ),
  });
  keychain.getGenericPassword.mockResolvedValueOnce({
    username: 'other',
    password: 'other-session',
  } as never);
  expect(await digiLockerSessionStorage.read('owner')).toBeNull();
});
it('stores recovery details in the owner-scoped device-only keychain and reports failed writes', async () => {
  keychain.setGenericPassword.mockResolvedValueOnce({
    service: 'test',
    storage: '',
  } as never);
  await digiLockerSessionStorage.save(
    'owner',
    'session',
    'https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize',
  );
  expect(keychain.setGenericPassword).toHaveBeenCalledWith(
    'owner',
    expect.stringContaining('authorizationUrl'),
    { service: 'com.readines.digilocker.owner', accessible: 'device-only' },
  );
  keychain.setGenericPassword.mockResolvedValueOnce(false);
  await expect(
    digiLockerSessionStorage.save('owner', 'session'),
  ).rejects.toThrow('Unable to save');
});
