import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { authApi } from '../../api/auth.api';
import { ApiError, refreshUser, setAccessToken } from '../../api/client';
import { sessionStorage } from '../../api/sessionStorage';
import type { AuthResponse, AuthUser } from '../../api/types';
import { environment } from '../../config/environment';
import {
  validateLoginInput,
  validatePasswordResetInput,
  validatePinLoginInput,
  validateSignupInput,
} from './auth.validators';

export type AuthStatus = 'restoring' | 'restoreFailed' | 'unauthenticated' | 'authenticated';
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

let configuredGoogleClientId: string | null = null;

function configureGoogleSignIn() {
  const { googleWebClientId, googleIosClientId } = environment;
  if (!googleWebClientId)
    throw new Error('Google Sign-In is not configured for this build.');
  if (configuredGoogleClientId === googleWebClientId) return;

  GoogleSignin.configure({
    webClientId: googleWebClientId,
    ...(googleIosClientId ? { iosClientId: googleIosClientId } : {}),
  });
  configuredGoogleClientId = googleWebClientId;
}

function googleSignInError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 400)
      return 'Google did not return a valid sign-in token. Please try again.';
    if (error.status === 401)
      return 'Google rejected the sign-in token. Verify GOOGLE_CLIENT_ID matches the app Web ID and configure GOOGLE_IOS_CLIENT_ID for iOS.';
    if (error.status === 429)
      return 'Too many Google sign-in attempts. Please wait and try again.';
    if (error.status === 503)
      return 'Google sign-in is not configured on the backend.';
    if (error.status >= 500) {
      return `Google sign-in service failed (HTTP ${error.status}).${error.errorId ? ` Reference: ${error.errorId}` : ' Please try again later.'}`;
    }
    return error.message;
  }
  if (isErrorWithCode(error)) {
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE)
      return 'Google Play Services are required to continue.';
    if (error.code === statusCodes.IN_PROGRESS)
      return 'A Google Sign-In request is already in progress.';
  }
  if (error instanceof TypeError)
    return 'Unable to reach the server. Check that the backend is running.';
  return 'Unable to sign in with Google. Please try again.';
}

async function persist(result: AuthResponse) {
  const token = result.accessToken ?? result.token;
  setAccessToken(token);
  await sessionStorage.writeAccessToken(token);
  return result.user;
}

export const restoreSession = createAsyncThunk(
  'auth/restore',
  async (_, { rejectWithValue }) => {
    try {
      return await refreshUser();
    } catch (error) {
      // Only an explicit rejection of the refresh session means login is needed.
      if (error instanceof ApiError && error.status === 401)
        return rejectWithValue('anonymous');
      throw error;
    }
  },
);
export const login = createAsyncThunk(
  'auth/login',
  async (input: { email: string; password: string }) => {
    const safeInput = validateLoginInput(input);
    return persist(await authApi.login(safeInput));
  },
);
export const signup = createAsyncThunk(
  'auth/signup',
  async (input: { name: string; email: string; password: string; otp: string }) => {
    const safeInput = validateSignupInput(input);
    const otp = input.otp.trim();
    if (!/^\d{6}$/.test(otp)) throw new Error('Enter the 6-digit code from your email.');
    return persist(await authApi.signup({ ...safeInput, otp }));
  },
);
export const requestSignupOtp = createAsyncThunk(
  'auth/requestSignupOtp',
  async (input: { name: string; email: string; password: string }) => {
    return authApi.requestSignupOtp(validateSignupInput(input));
  },
);

export const loginWithPin = createAsyncThunk(
  'auth/loginWithPin',
  async (input: { email: string; pin: string }) =>
    persist(await authApi.loginWithPin(validatePinLoginInput(input))),
);

export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (email: string, { rejectWithValue }) => {
    try {
      const safeEmail = validatePasswordResetInput(email);
      return await authApi.forgotPasswordOtp(safeEmail);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unable to request a reset.',
      );
    }
  },
);

export const googleLogin = createAsyncThunk(
  'auth/google',
  async (_, { rejectWithValue }) => {
    try {
      configureGoogleSignIn();
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return rejectWithValue(null);
      if (!response.data.idToken)
        return rejectWithValue('Google did not return an ID token.');
      return persist(await authApi.google(response.data.idToken));
    } catch (error) {
      return rejectWithValue(googleSignInError(error));
    }
  },
);
export const logout = createAsyncThunk('auth/logout', async () => {
  await authApi.logout().catch(() => undefined);
  setAccessToken(null);
  await sessionStorage.clear().catch(() => undefined);
});

export const logoutAll = createAsyncThunk('auth/logoutAll', async () => {
  await authApi.logoutAll();
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
    sessionExpired: state => {
      state.status = 'unauthenticated';
      state.user = null;
      state.error = 'Your session expired. Please sign in again.';
    },
    updateCurrentUser: (state, action: { payload: AuthUser }) => {
      state.user = action.payload;
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
      action: { error: { message?: string }; payload?: unknown },
    ) => {
      state.submitting = false;
      state.status = 'unauthenticated';
      state.user = null;
      state.error =
        action.payload === null
          ? null
          : typeof action.payload === 'string'
            ? action.payload
            : action.error.message ?? 'Authentication failed.';
    };
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload;
      })
      .addCase(restoreSession.pending, state => {
        if (state.status === 'restoreFailed') state.status = 'restoring';
      })
      .addCase(restoreSession.rejected, (state, action) => {
        if (action.payload === 'anonymous') {
          state.user = null;
          state.status = 'unauthenticated';
        } else if (state.status === 'restoring') {
          state.status = 'restoreFailed';
        }
      })
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, fulfilled)
      .addCase(login.rejected, rejected)
      .addCase(loginWithPin.pending, pending)
      .addCase(loginWithPin.fulfilled, fulfilled)
      .addCase(loginWithPin.rejected, rejected)
      .addCase(signup.pending, pending)
      .addCase(signup.fulfilled, fulfilled)
      .addCase(signup.rejected, rejected)
      .addCase(requestSignupOtp.pending, pending)
      .addCase(requestSignupOtp.fulfilled, state => {
        state.submitting = false;
      })
      .addCase(requestSignupOtp.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.error.message ?? 'Unable to send signup code.';
      })
      .addCase(requestPasswordReset.pending, state => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, state => {
        state.submitting = false;
        state.error = null;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.submitting = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Unable to request a reset.';
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
      })
      .addCase(logoutAll.pending, pending)
      .addCase(logoutAll.fulfilled, state => {
        state.status = 'unauthenticated';
        state.user = null;
        state.submitting = false;
        state.error = null;
      })
      .addCase(logoutAll.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.error.message ?? 'Unable to sign out everywhere.';
      });
  },
});
export const { clearAuthError, sessionExpired, updateCurrentUser } = slice.actions;
export const authReducer = slice.reducer;
