import { createSlice } from '@reduxjs/toolkit';
const slice = createSlice({
  name: 'onboarding',
  initialState: { completed: false },
  reducers: {
    onboardingCompleted: state => {
      state.completed = true;
    },
  },
});
export const { onboardingCompleted } = slice.actions;
export const onboardingReducer = slice.reducer;
