import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '../store/store';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { initializeDatabase } from '../../database';
import { setSessionExpiredHandler } from '../../api/client';
import { restoreSession, sessionExpired } from '../../features/auth/authSlice';
import { restoreOnboarding } from '../../features/onboarding/onboardingSlice';
export function AppProviders({ children }: React.PropsWithChildren) {
  useEffect(() => {
    setSessionExpiredHandler(() => store.dispatch(sessionExpired()));
    store.dispatch(restoreOnboarding());
    // Session restore must not depend on local storage becoming ready.
    initializeDatabase().catch(error =>
      console.warn('Local database initialization failed', error),
    );
    store.dispatch(restoreSession());
    return () => setSessionExpiredHandler(null);
  }, []);
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppThemeProvider>{children}</AppThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
