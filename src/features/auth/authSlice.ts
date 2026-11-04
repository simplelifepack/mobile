import { sessionGateEmail } from '../../security/sessionGate';
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { googleIdToken } from './services/googleSignIn';
import { authApi } from '../../api/auth.api';
import { ApiError, setAccessToken } from '../../api/client';
import { sessionStorage } from '../../api/sessionStorage';
import type { AuthResponse, AuthUser } from '../../api/types';

export type AuthStatus =
  | 'restoring'
  | 'restoreFailed'
  | 'expired'
  | 'unauthenticated'
  | 'authenticated';
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
  if (
    sessionGateEmail() &&
    result.user.email.toLowerCase() !== sessionGateEmail()?.toLowerCase()
  )
    throw new Error(
      'Sign in to the same account to resume your protected work.',
    );
  const token = result.accessToken ?? result.token;
  setAccessToken(token);
  await sessionStorage.writeAccessToken(token);
  return result.user;
}

export const restoreSession = createAsyncThunk<
  AuthUser,
  void,
  { rejectValue: { retryable: boolean; message: string } }
>('auth/restore', async (_, { rejectWithValue }) => {
  try {
    const token = await sessionStorage.readAccessToken();
    setAccessToken(token ?? '__restore__');
    return (await authApi.me()).user;
  } catch (error) {
    const rejected =
      error instanceof ApiError && [401, 403].includes(error.status);
    if (rejected) {
      setAccessToken(null);
      await sessionStorage.clear().catch(() => undefined);
    }
    return rejectWithValue({
      retryable: !rejected,
      message: rejected
        ? 'Your session expired. Please sign in again.'
        : 'Unable to restore your session. Check your connection and retry.',
    });
  }
});
export const login = createAsyncThunk(
  'auth/login',
  async (input: { email: string; password: string }) =>
    persist(await authApi.login(input)),
);
export const loginWithPin = createAsyncThunk(
  'auth/loginWithPin',
  async (input: { email: string; pin: string }) =>
    persist(await authApi.loginWithPin(input)),
);
export const requestSignupOtp = createAsyncThunk(
  'auth/requestSignupOtp',
  async (input: { name: string; email: string; password: string }) =>
    authApi.requestSignupOtp(input),
);
export const signup = createAsyncThunk(
  'auth/signup',
  async (input: {
    name: string;
    email: string;
    password: string;
    otp: string;
  }) => persist(await authApi.signup(input)),
);
export const setupPin = createAsyncThunk(
  'auth/setupPin',
  async (pin: string) => {
    const result = await authApi.setupPin(pin);
    return result.user;
  },
);
export const changePin = createAsyncThunk(
  'auth/changePin',
  async (input: { currentPin: string; newPin: string }) =>
    authApi.changePin(input),
);
export const requestPinReset = createAsyncThunk(
  'auth/requestPinReset',
  async () => authApi.requestPinReset(),
);
export const resetPin = createAsyncThunk(
  'auth/resetPin',
  async (input: { otp: string; newPin: string }) => authApi.resetPin(input),
);
export const googleLogin = createAsyncThunk('auth/google', async () => {
  return persist(await authApi.google(await googleIdToken()));
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
    sessionExpired: (state, action: PayloadAction<string | undefined>) => {
      state.status = state.user ? 'expired' : 'unauthenticated';
      state.submitting = false;
      state.error =
        action.payload ?? 'Your session expired. Please sign in again.';
    },
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
      if (state.status !== 'expired') {
        state.status = 'unauthenticated';
        state.user = null;
      }
      state.error = action.error.message ?? 'Authentication failed.';
    };
    builder
      .addCase(restoreSession.pending, state => {
        state.status = 'restoring';
        state.error = null;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload;
        state.error = null;
      })
      .addCase(restoreSession.rejected, (state, action) => {
        state.status = action.payload?.retryable
          ? 'restoreFailed'
          : 'unauthenticated';
        state.user = null;
        state.error =
          action.payload?.message ?? 'Unable to restore your session.';
      })
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, fulfilled)
      .addCase(login.rejected, rejected)
      .addCase(loginWithPin.pending, pending)
      .addCase(loginWithPin.fulfilled, fulfilled)
      .addCase(loginWithPin.rejected, rejected)
      .addCase(requestSignupOtp.pending, pending)
      .addCase(requestSignupOtp.fulfilled, state => {
        state.submitting = false;
        state.error = null;
      })
      .addCase(requestSignupOtp.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.error.message ?? 'Unable to send signup code.';
      })
      .addCase(signup.pending, pending)
      .addCase(signup.fulfilled, fulfilled)
      .addCase(signup.rejected, rejected)
      .addCase(setupPin.pending, pending)
      .addCase(setupPin.fulfilled, fulfilled)
      .addCase(setupPin.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.error.message ?? 'Unable to create PIN.';
      })
      .addCase(changePin.pending, pending)
      .addCase(changePin.fulfilled, state => {
        state.submitting = false;
      })
      .addCase(changePin.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.error.message ?? 'Unable to update PIN.';
      })
      .addCase(requestPinReset.pending, pending)
      .addCase(requestPinReset.fulfilled, state => {
        state.submitting = false;
      })
      .addCase(requestPinReset.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          action.error.message ?? 'Unable to send verification code.';
      })
      .addCase(resetPin.pending, pending)
      .addCase(resetPin.fulfilled, state => {
        state.submitting = false;
      })
      .addCase(resetPin.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.error.message ?? 'Unable to reset PIN.';
      })
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
export const { clearAuthError, sessionExpired } = slice.actions;
export const authReducer = slice.reducer;
