import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
export type LockDelay = 'immediately' | 30 | 60 | 300;
const slice = createSlice({
  name: 'appLock',
  initialState: {
    accountId: null as string | null,
    ready: false,
    biometrics: false,
    error: '',
    generation: 0,
    enabled: false,
    locked: false,
    lockDelaySeconds: 'immediately' as LockDelay,
    backgroundedAt: null as number | null,
  },
  reducers: {
    lockLoading: (state, action: PayloadAction<string>) => {
      state.generation += 1;
      state.accountId = action.payload;
      state.ready = false;
      state.locked = true;
      state.error = '';
    },
    lockConfigured: (
      state,
      action: PayloadAction<{
        accountId: string;
        enabled: boolean;
        biometrics: boolean;
      }>,
    ) => {
      if (state.accountId !== action.payload.accountId) return;
      state.ready = true;
      state.enabled = action.payload.enabled;
      state.biometrics = action.payload.enabled && action.payload.biometrics;
      state.locked = action.payload.enabled;
    },
    lockSettingsChanged: (
      state,
      action: PayloadAction<{
        accountId: string;
        enabled: boolean;
        biometrics: boolean;
      }>,
    ) => {
      if (state.accountId !== action.payload.accountId || !state.ready) return;
      state.enabled = action.payload.enabled;
      state.biometrics = state.enabled && action.payload.biometrics;
      if (!state.enabled) state.locked = false;
    },
    lockLoadFailed: (state, action: PayloadAction<string>) => {
      if (state.accountId !== action.payload) return;
      state.ready = true;
      state.enabled = true;
      state.biometrics = false;
      state.locked = true;
      state.error =
        'App-lock settings could not be read. Unlock with your R-pin.';
    },
    lockCleared: state => {
      state.generation += 1;
      state.accountId = null;
      state.ready = false;
      state.enabled = false;
      state.biometrics = false;
      state.locked = false;
      state.error = '';
      state.backgroundedAt = null;
    },
    lockEnabled: (state, action: PayloadAction<boolean>) => {
      state.enabled = action.payload;
    },
    locked: state => {
      if (state.enabled) {
        state.locked = true;
        state.generation += 1;
      }
    },
    unlockVerified: (
      state,
      action: PayloadAction<{ accountId: string; generation: number }>,
    ) => {
      if (
        state.ready &&
        state.accountId === action.payload.accountId &&
        state.generation === action.payload.generation
      )
        state.locked = false;
    },
    unlocked: state => {
      if (state.ready) state.locked = false;
    },
    appBackgrounded: (state, action: PayloadAction<number>) => {
      state.backgroundedAt = action.payload;
    },
  },
});
export const {
  lockEnabled,
  locked,
  unlocked,
  appBackgrounded,
  lockLoading,
  lockConfigured,
  lockSettingsChanged,
  lockLoadFailed,
  lockCleared,
  unlockVerified,
} = slice.actions;
export const appLockReducer = slice.reducer;
