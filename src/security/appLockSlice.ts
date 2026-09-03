import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
export type LockDelay = 'immediately' | 30 | 60 | 300;
const slice = createSlice({
  name: 'appLock',
  initialState: {
    enabled: false,
    locked: false,
    lockDelaySeconds: 'immediately' as LockDelay,
    backgroundedAt: null as number | null,
  },
  reducers: {
    lockEnabled: (state, action: PayloadAction<boolean>) => {
      state.enabled = action.payload;
    },
    locked: state => {
      if (state.enabled) state.locked = true;
    },
    unlocked: state => {
      state.locked = false;
    },
    appBackgrounded: (state, action: PayloadAction<number>) => {
      state.backgroundedAt = action.payload;
    },
  },
});
export const { lockEnabled, locked, unlocked, appBackgrounded } = slice.actions;
export const appLockReducer = slice.reducer;
