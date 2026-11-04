import { setSessionGate } from '../../security/sessionGate';
import { flushDrafts } from '../../storage/formDraftStorage';
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from '../../services/api';
import { setUnauthorizedHandler } from '../../api/client';
import { authReducer, sessionExpired } from '../../features/auth/authSlice';
import { onboardingReducer } from '../../features/onboarding/onboardingSlice';
import { appLockReducer } from '../../security/appLockSlice';
import { accountIsolationMiddleware } from './accountIsolationMiddleware';
export const store = configureStore({
  reducer: {
    auth: authReducer,
    onboarding: onboardingReducer,
    appLock: appLockReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(accountIsolationMiddleware, api.middleware),
});
setUnauthorizedHandler(async () => {
  const email = store.getState().auth.user?.email;
  if (email) setSessionGate(email);
  const saved = await flushDrafts();
  store.dispatch(
    sessionExpired(
      saved
        ? 'Your session expired. Non-secret form drafts are kept on this device. Sign in with the same account to resume.'
        : 'Your session expired. Some drafts could not be saved on this device. Please sign in again.',
    ),
  );
  store.dispatch(api.util.resetApiState());
});
setupListeners(store.dispatch);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
