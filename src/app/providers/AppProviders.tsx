import React, { useEffect } from 'react';
import { View } from 'react-native';
import styled from 'styled-components/native';
import { SessionGuard } from '../../security/SessionGuard';
import { NetworkBanner } from '../../network/NetworkBanner';
import { startConnectivity } from '../../network/connectivity';
const Root = styled(View)({ flex: 1 });
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '../store/store';
import { AppThemeProvider } from '../../design/theme/ThemeProvider';

import { restoreSession } from '../../features/auth/authSlice';
export function AppProviders({ children }: React.PropsWithChildren) {
  useEffect(() => startConnectivity(), []);
  useEffect(() => {
    // The API-backed screens do not need SQLite before session restoration.
    // Local repositories initialize their database lazily on first use.
    store.dispatch(restoreSession());
  }, []);
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <Root>
            <NetworkBanner />
            <SessionGuard>{children}</SessionGuard>
          </Root>
        </AppThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
