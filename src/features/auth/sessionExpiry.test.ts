import { configureStore } from '@reduxjs/toolkit';
import { authReducer, login, sessionExpired } from './authSlice';
import { authApi } from '../../api/auth.api';
import { setSessionGate } from '../../security/sessionGate';
import type { AuthUser } from '../../api/types';
jest.mock('./services/googleSignIn', () => ({ googleIdToken: jest.fn() }));
jest.mock('../../api/auth.api', () => ({ authApi: { login: jest.fn() } }));
jest.mock('../../api/client', () => ({ setAccessToken: jest.fn() }));
jest.mock('../../api/sessionStorage', () => ({
  sessionStorage: { writeAccessToken: jest.fn() },
}));
it('retains the owner during expiry and rejected reauthentication, and rejects another account', async () => {
  const store = configureStore({ reducer: { auth: authReducer } });
  const owner = {
    id: 'owner',
    email: 'owner@example.test',
    name: 'Owner',
    pinConfigured: true,
  } as AuthUser;
  const credentials = { email: owner.email, password: 'not-real' };
  store.dispatch(login.fulfilled(owner, 'initial', credentials));
  setSessionGate(owner.email);
  store.dispatch(sessionExpired());
  expect(store.getState().auth).toMatchObject({
    status: 'expired',
    user: owner,
  });
  jest.mocked(authApi.login).mockResolvedValue({
    token: 'not-real',
    accessToken: 'not-real',
    user: { ...owner, id: 'other', email: 'other@example.test' },
  });
  await store.dispatch(login(credentials));
  expect(store.getState().auth).toMatchObject({
    status: 'expired',
    user: owner,
  });
  expect(store.getState().auth.error).toContain('same account');
  setSessionGate(null);
});
