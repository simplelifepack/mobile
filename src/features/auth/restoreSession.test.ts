import { configureStore } from '@reduxjs/toolkit';
import { authReducer, restoreSession } from './authSlice';
import { authApi } from '../../api/auth.api';
import { ApiError, setAccessToken } from '../../api/client';
import { sessionStorage } from '../../api/sessionStorage';

jest.mock('./services/googleSignIn', () => ({ googleIdToken: jest.fn() }));
jest.mock('../../api/auth.api', () => ({ authApi: { me: jest.fn() } }));
jest.mock('../../api/client', () => ({
  ApiError: class extends Error {
    constructor(message: string, mockStatus: number) {
      super(message);
      Object.assign(this, { status: mockStatus });
    }
  },
  setAccessToken: jest.fn(),
}));
jest.mock('../../api/sessionStorage', () => ({ sessionStorage: {
  readAccessToken: jest.fn(), clear: jest.fn(), writeAccessToken: jest.fn(),
} }));
const user = { id: 'synthetic-user', name: 'Audit', email: 'audit@example.test' };
beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(sessionStorage.readAccessToken).mockResolvedValue('saved-token');
  jest.mocked(sessionStorage.clear).mockResolvedValue(undefined);
});

it.each([new TypeError('Network request failed'), new ApiError('timeout', 408), new ApiError('unavailable', 503)])(
  'preserves secure credentials after a temporary restore failure and allows retry: %s',
  async error => {
    const store = configureStore({ reducer: { auth: authReducer } });
    jest.mocked(authApi.me).mockRejectedValueOnce(error).mockResolvedValueOnce({ user });
    await store.dispatch(restoreSession());
    expect(store.getState().auth.status).toBe('restoreFailed');
    expect(sessionStorage.clear).not.toHaveBeenCalled();
    expect(setAccessToken).not.toHaveBeenCalledWith(null);
    const retry = store.dispatch(restoreSession());
    expect(store.getState().auth.status).toBe('restoring');
    await retry;
    expect(store.getState().auth).toMatchObject({ status: 'authenticated', user, error: null });
  },
);
it.each([401, 403])('clears rejected credentials after HTTP %s', async status => {
  const store = configureStore({ reducer: { auth: authReducer } });
  jest.mocked(authApi.me).mockRejectedValue(new ApiError('rejected', status));
  await store.dispatch(restoreSession());
  expect(store.getState().auth.status).toBe('unauthenticated');
  expect(sessionStorage.clear).toHaveBeenCalledTimes(1);
  expect(setAccessToken).toHaveBeenCalledWith(null);
});
it('allows retry when secure storage temporarily cannot be read', async () => {
  const store = configureStore({ reducer: { auth: authReducer } });
  jest.mocked(sessionStorage.readAccessToken).mockRejectedValue(new Error('temporarily unavailable'));
  await store.dispatch(restoreSession());
  expect(store.getState().auth.status).toBe('restoreFailed');
  expect(sessionStorage.clear).not.toHaveBeenCalled();
  expect(authApi.me).not.toHaveBeenCalled();
});
