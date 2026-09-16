import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { authApi } from '../../api/auth.api';
import { ApiError, setAccessToken } from '../../api/client';
import { sessionStorage } from '../../api/sessionStorage';
import type { AuthResponse, AuthUser } from '../../api/types';
import { environment } from '../../config/environment';
import {
  validateLoginInput,
  validatePasswordResetInput,
  validateSignupInput,
} from './auth.validators';

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
  if (error instanceof ApiError) return error.message;
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
  async (input: { email: string; password: string }) => {
    const safeInput = validateLoginInput(input);
    return persist(await authApi.login(safeInput));
  },
);
export const signup = createAsyncThunk(
  'auth/signup',
  async (input: { name: string; email: string; password: string }) => {
    const safeInput = validateSignupInput(input);
    return persist(await authApi.signup(safeInput));
  },
);

export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (email: string, { rejectWithValue }) => {
    try {
      const safeEmail = validatePasswordResetInput(email);
      return await authApi.forgotPassword(safeEmail);
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
      });
  },
});
export const { clearAuthError } = slice.actions;
export const authReducer = slice.reducer;
