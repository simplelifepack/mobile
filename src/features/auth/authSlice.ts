import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { authApi } from '../../api/auth.api';
import { setAccessToken } from '../../api/client';
import { sessionStorage } from '../../api/sessionStorage';
import type { AuthResponse, AuthUser } from '../../api/types';
import { environment } from '../../config/environment';

export type AuthStatus = 'restoring' | 'unauthenticated' | 'authenticated';
type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  submitting: boolean;
  error: string | null;
};
const initialState: AuthState = {
  status: 'restoring',
  user: null,
  submitting: false,
  error: null,
};

async function persist(result: AuthResponse) {
  const token = result.accessToken ?? result.token;
  setAccessToken(token);
  await sessionStorage.writeAccessToken(token);
  return result.user;
}

export const restoreSession = createAsyncThunk('auth/restore', async () => {
  const token = await sessionStorage.readAccessToken();
  setAccessToken(token ?? '__restore__');
  try {
    return (await authApi.me()).user;
  } catch (error) {
    setAccessToken(null);
    await sessionStorage.clear();
    throw error;
  }
});
export const login = createAsyncThunk(
  'auth/login',
  async (input: { email: string; password: string }) =>
    persist(await authApi.login(input)),
);
export const signup = createAsyncThunk(
  'auth/signup',
  async (input: { name: string; email: string; password: string }) =>
    persist(await authApi.signup(input)),
);
export const googleLogin = createAsyncThunk('auth/google', async () => {
  if (!environment.googleWebClientId)
    throw new Error('Google Sign-In is not configured for this build.');
  GoogleSignin.configure({
    webClientId: environment.googleWebClientId,
    iosClientId: environment.googleIosClientId,
  });
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response))
    throw new Error('Google Sign-In was cancelled.');
  if (!response.data.idToken)
    throw new Error('Google did not return an ID token.');
  return persist(await authApi.google(response.data.idToken));
});
export const logout = createAsyncThunk('auth/logout', async () => {
  await authApi.logout().catch(() => undefined);
  setAccessToken(null);
  await sessionStorage.clear().catch(() => undefined);
});

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    const pending = (state: AuthState) => {
      state.submitting = true;
      state.error = null;
    };
    const fulfilled = (state: AuthState, action: { payload: AuthUser }) => {
      state.submitting = false;
      state.status = 'authenticated';
      state.user = action.payload;
    };
    const rejected = (
      state: AuthState,
      action: { error: { message?: string } },
    ) => {
      state.submitting = false;
      state.status = 'unauthenticated';
      state.user = null;
      state.error = action.error.message ?? 'Authentication failed.';
    };
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload;
      })
      .addCase(restoreSession.rejected, state => {
        state.status = 'unauthenticated';
        state.user = null;
      })
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, fulfilled)
      .addCase(login.rejected, rejected)
      .addCase(signup.pending, pending)
      .addCase(signup.fulfilled, fulfilled)
      .addCase(signup.rejected, rejected)
      .addCase(googleLogin.pending, pending)
      .addCase(googleLogin.fulfilled, fulfilled)
      .addCase(googleLogin.rejected, rejected)
      .addCase(logout.pending, pending)
      .addCase(logout.fulfilled, state => {
        state.status = 'unauthenticated';
        state.user = null;
        state.submitting = false;
        state.error = null;
      });
  },
});
export const { clearAuthError } = slice.actions;
export const authReducer = slice.reducer;
