import * as Keychain from 'react-native-keychain';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const SERVICE = 'com.readiness.onboarding';

type OnboardingState = {
  completed: boolean;
  restoring: boolean;
};

const initialState: OnboardingState = {
  completed: false,
  restoring: true,
};

export const restoreOnboarding = createAsyncThunk(
  'onboarding/restore',
  async () => {
    const value = await Keychain.getGenericPassword({ service: SERVICE });
    return value !== false && value.password === 'completed';
  },
);

const slice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    onboardingCompleted: state => {
      state.completed = true;
      void Keychain.setGenericPassword('readiness', 'completed', {
        service: SERVICE,
        accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      });
    },
  },
  extraReducers: builder => {
    builder
      .addCase(restoreOnboarding.fulfilled, (state, action) => {
        state.completed = action.payload;
        state.restoring = false;
      })
      .addCase(restoreOnboarding.rejected, state => {
        state.restoring = false;
      });
  },
});
export const { onboardingCompleted } = slice.actions;
export const onboardingReducer = slice.reducer;
