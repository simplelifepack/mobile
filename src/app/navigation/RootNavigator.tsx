import React from 'react';
import { NavigationContainer, type LinkingOptions, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { useAppSelector } from '../store/hooks';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { OnboardingNavigator } from './OnboardingNavigator';
import { AuthNavigator } from './AuthNavigator';
import { MainTabs } from './MainTabs';
import { AppLockScreen } from '../../components/security/AppLockScreen';
import { ProfileScreen } from '../../features/profile/ProfileScreen';
import { DigiLockerScreen } from '../../features/integrations/digilocker/DigiLockerScreen';
import { IntegrationsScreen } from '../../features/profile/IntegrationsScreen';
import { PinSetupScreen } from '../../features/auth/screens/PinSetupScreen';
import { LoadingState } from '../../components/feedback/LoadingState';
import { View } from 'react-native';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Button } from '../../components/primitives/Button';
import { useAppDispatch } from '../store/hooks';
import { restoreSession } from '../../features/auth/authSlice';
import { useBootstrapQuery } from '../../services/api';
import { fontWeights } from '../../design/tokens/typography';
const Stack = createNativeStackNavigator<RootStackParamList>();
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['readiness://'],
};
export function RootNavigator() {
  const onboardingComplete = useAppSelector(
    state => state.onboarding.completed,
  );
  const onboardingRestoring = useAppSelector(
    state => state.onboarding.restoring,
  );
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector(state => state.auth.status);
  const authUser = useAppSelector(state => state.auth.user);
  const guestPreview = __DEV__ && authStatus === 'unauthenticated';
  useBootstrapQuery(undefined, { skip: authStatus !== 'authenticated' });
  const isLocked = useAppSelector(state => state.appLock.locked);
  const { theme } = useAppTheme();
  const navigationTheme: Theme = {
    dark: theme.isDark,
    colors: {
      primary: theme.colors.text.interactive,
      background: theme.colors.surface.canvas,
      card: theme.colors.surface.default,
      text: theme.colors.text.primary,
      border: theme.colors.border.default,
      notification: theme.colors.status.danger.text,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: fontWeights.regular },
      medium: { fontFamily: 'System', fontWeight: fontWeights.medium },
      bold: { fontFamily: 'System', fontWeight: fontWeights.bold },
      heavy: { fontFamily: 'System', fontWeight: fontWeights.bold },
    },
  };
  return (
    <NavigationContainer linking={linking} theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {authStatus === 'restoring' || onboardingRestoring ? (
          <Stack.Screen
            name="AppLock"
            children={() => (
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <LoadingState fill label="Restoring your session…" />
              </View>
            )}
          />
        ) : authStatus === 'restoreFailed' ? (
          <Stack.Screen
            name="AppLock"
            children={() => (
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <ErrorState message="We couldn't reach the server to restore your session." />
                <Button
                  title="Retry"
                  onPress={() => dispatch(restoreSession())}
                />
              </View>
            )}
          />
        ) : authStatus === 'authenticated' && authUser?.pinConfigured === false ? (
          <Stack.Screen name="AppLock">
            {() => <PinSetupScreen email={authUser.email} />}
          </Stack.Screen>
        ) : authStatus === 'authenticated' ? (
          isLocked ? (
            <Stack.Screen name="AppLock" component={AppLockScreen} />
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Integrations" component={IntegrationsScreen} />
              <Stack.Screen name="DigiLocker" component={DigiLockerScreen} />
            </>
          )
        ) : guestPreview ? (
          <>
            <Stack.Screen name="Auth" component={AuthNavigator} />
            <Stack.Screen name="Main" component={MainTabs} />
          </>
        ) : !onboardingComplete ? (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
