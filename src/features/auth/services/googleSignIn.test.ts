import { Platform } from 'react-native';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { environment } from '../../../config/environment';
import { googleIdToken } from './googleSignIn';
jest.mock('../../../config/environment', () => ({
  environment: {
    googleWebClientId: 'web.apps.googleusercontent.com',
    googleIosClientId: 'ios.apps.googleusercontent.com',
  },
}));
beforeEach(() => {
  jest.clearAllMocks();
  environment.googleWebClientId = 'web.apps.googleusercontent.com';
  environment.googleIosClientId = 'ios.apps.googleusercontent.com';
  (GoogleSignin.signIn as jest.Mock).mockResolvedValue({
    type: 'success',
    data: { idToken: 'verified-by-server' },
  });
  (isSuccessResponse as unknown as jest.Mock).mockImplementation(
    response => response.type === 'success',
  );
});
afterEach(() => jest.restoreAllMocks());
it('checks Android Play services and returns the Google token for backend verification', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  expect(await googleIdToken()).toBe('verified-by-server');
  expect(GoogleSignin.hasPlayServices).toHaveBeenCalledWith({
    showPlayServicesUpdateDialog: true,
  });
});
it('requires the iOS client before entering native sign-in, preventing a missing-client native failure', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  environment.googleIosClientId = undefined;
  await expect(googleIdToken()).rejects.toThrow('iOS is not configured');
  expect(GoogleSignin.signIn).not.toHaveBeenCalled();
});
it('uses iOS configuration without checking Android Play services', async () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  expect(await googleIdToken()).toBe('verified-by-server');
  expect(GoogleSignin.hasPlayServices).not.toHaveBeenCalled();
});
it.each([{ type: 'cancelled' }, { type: 'success', data: {} }])(
  'does not authenticate incomplete Google responses: %p',
  async response => {
    jest.replaceProperty(Platform, 'OS', 'android');
    (GoogleSignin.signIn as jest.Mock).mockResolvedValue(response);
    await expect(googleIdToken()).rejects.toThrow();
  },
);
it('propagates provider failures without returning a token', async () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  (GoogleSignin.signIn as jest.Mock).mockRejectedValue(
    new Error('DEVELOPER_ERROR'),
  );
  await expect(googleIdToken()).rejects.toThrow('DEVELOPER_ERROR');
});
