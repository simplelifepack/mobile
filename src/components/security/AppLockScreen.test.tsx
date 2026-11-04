import React from 'react';
import { appLockStorage } from '../../security/appLockStorage';
import Renderer, { act } from 'react-test-renderer';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { AppLockScreen } from './AppLockScreen';
import { PinInput } from './PinInput';
import { Button } from '../primitives/Button';
import { authApi } from '../../api/auth.api';
import { sessionStorage } from '../../api/sessionStorage';
const mockDispatch = jest.fn();
const mockLock = { generation: 0, biometrics: false };
const mockUser = { id: 'user', email: 'user@example.test', name: 'User' };
jest.mock('../../app/store/hooks', () => ({
  useAppSelector: (select: (state: unknown) => unknown) =>
    select({ auth: { user: mockUser }, appLock: mockLock }),
  useAppDispatch: () => mockDispatch,
}));
jest.mock('../../app/store/store', () => ({
  store: {
    getState: () => ({ auth: { user: mockUser }, appLock: mockLock }),
  },
}));
jest.mock('../../api/auth.api', () => ({
  authApi: { loginWithPin: jest.fn() },
}));
jest.mock('../../api/sessionStorage', () => ({
  sessionStorage: { writeAccessToken: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../api/client', () => ({
  setAccessToken: jest.fn(),
  invalidateReadCaches: jest.fn(),
}));
jest.mock('../../security/appLockStorage', () => ({
  appLockStorage: { authenticate: jest.fn() },
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockLock.generation = 0;
  mockLock.biometrics = false;
});
afterEach(() => jest.restoreAllMocks());
it.each([true, false])(
  'only unlocks after the server accepts the current account PIN: accepted=%s',
  async accepted => {
    if (accepted)
      (authApi.loginWithPin as jest.Mock).mockResolvedValue({
        token: 'valid',
        user: mockUser,
      });
    else
      (authApi.loginWithPin as jest.Mock).mockRejectedValue(
        Object.assign(new Error('Request failed.'), { status: 401 }),
      );
    let root!: Renderer.ReactTestRenderer;
    await act(async () => {
      root = Renderer.create(
        <AppThemeProvider>
          <AppLockScreen />
        </AppThemeProvider>,
      );
    });
    await act(async () => {
      root.root.findByType(PinInput).props.onChange('123456');
    });
    await act(async () => {
      root.root
        .findAllByType(Button)
        .find(button => button.props.title === 'Use PIN')!
        .props.onPress();
    });
    expect(authApi.loginWithPin).toHaveBeenCalledWith({
      email: mockUser.email,
      pin: '123456',
    });
    if (accepted) {
      expect(sessionStorage.writeAccessToken).toHaveBeenCalledWith('valid');
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'appLock/unlockVerified',
        payload: { accountId: 'user', generation: 0 },
      });
    } else {
      expect(sessionStorage.writeAccessToken).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
      expect(JSON.stringify(root.toJSON())).toContain(
        'Incorrect R-pin. Try again.',
      );
    }
    await act(async () => {
      root.unmount();
    });
  },
);

it.each(['success', 'cancel', 'background'])(
  'handles biometric %s without bypassing the lock',
  async outcome => {
    mockLock.biometrics = true;
    (appLockStorage.authenticate as jest.Mock).mockImplementation(async () => {
      if (outcome === 'cancel') throw new Error('Cancelled. Use R-pin.');
      if (outcome === 'background') mockLock.generation++;
    });
    let root!: Renderer.ReactTestRenderer;
    await act(async () => {
      root = Renderer.create(
        <AppThemeProvider>
          <AppLockScreen />
        </AppThemeProvider>,
      );
    });
    await act(async () => {
      root.root
        .findAllByType(Button)
        .find(button => button.props.title === 'Unlock with biometrics')!
        .props.onPress();
    });
    expect(appLockStorage.authenticate).toHaveBeenCalledWith('user');
    if (outcome === 'success')
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'appLock/unlockVerified',
        payload: { accountId: 'user', generation: 0 },
      });
    else expect(mockDispatch).not.toHaveBeenCalled();
    expect(sessionStorage.writeAccessToken).not.toHaveBeenCalled();
    await act(async () => root.unmount());
  },
);
