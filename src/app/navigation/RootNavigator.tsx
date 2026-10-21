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
import { FamilyScreen } from '../../features/trust/FamilyScreen';
import { TrustScreen } from '../../features/trust/TrustScreen';
import { IntegrationsScreen } from '../../features/profile/IntegrationsScreen';
import { InvitationScreen } from '../../features/trust/InvitationScreen';
import { PinSetupScreen } from '../../features/auth/screens/PinSetupScreen';
import { LoadingState } from '../../components/feedback/LoadingState';
import { View } from 'react-native';
import { useBootstrapQuery } from '../../services/api';
const Stack = createNativeStackNavigator<RootStackParamList>();
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['readiness://'],
  config: { screens: { Invitation: 'invite/:token' } },
};
export function RootNavigator() {
  const onboardingComplete = useAppSelector(
    state => state.onboarding.completed,
  );
  const onboardingRestoring = useAppSelector(
    state => state.onboarding.restoring,
  );
  const authStatus = useAppSelector(state => state.auth.status);
  const authUser = useAppSelector(state => state.auth.user);
  const guestPreview = __DEV__ && authStatus === 'unauthenticated';
  useBootstrapQuery(undefined, { skip: authStatus !== 'authenticated' });
  const isLocked = useAppSelector(state => state.appLock.locked);
  const { theme } = useAppTheme();
  const navigationTheme: Theme = {
    dark: theme.isDark,
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '700' },
      heavy: { fontFamily: 'System', fontWeight: '700' },
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
                <LoadingState label="Restoring your session…" />
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
              <Stack.Screen name="Family" component={FamilyScreen} />
              <Stack.Screen name="Trust" component={TrustScreen} />
              <Stack.Screen name="Integrations" component={IntegrationsScreen} />
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
        <Stack.Screen name="Invitation" component={InvitationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
