import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '../store/store';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';
import { initializeDatabase } from '../../database';
import { restoreSession } from '../../features/auth/authSlice';
export function AppProviders({ children }: React.PropsWithChildren) {
  useEffect(() => {
    initializeDatabase()
      .catch(error =>
        console.warn('Local database initialization failed', error),
      )
      .finally(() => store.dispatch(restoreSession()));
  }, []);
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppThemeProvider>{children}</AppThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
