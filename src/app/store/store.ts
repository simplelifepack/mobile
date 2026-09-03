import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from '../../services/api';
import { authReducer } from '../../features/auth/authSlice';
import { onboardingReducer } from '../../features/onboarding/onboardingSlice';
import { appLockReducer } from '../../security/appLockSlice';
export const store = configureStore({
  reducer: {
    auth: authReducer,
    onboarding: onboardingReducer,
    appLock: appLockReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(api.middleware),
});
setupListeners(store.dispatch);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
