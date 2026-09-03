import React from 'react';
import { NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { useAppSelector } from '../store/hooks';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { OnboardingNavigator } from './OnboardingNavigator';
import { AuthNavigator } from './AuthNavigator';
import { MainTabs } from './MainTabs';
import { AppLockScreen } from '../../components/security/AppLockScreen';
import { LoadingState } from '../../components/feedback/LoadingState';
import { View } from 'react-native';
import { useBootstrapQuery } from '../../services/api';
const Stack = createNativeStackNavigator<RootStackParamList>();
export function RootNavigator() {
  const onboardingComplete = useAppSelector(
    state => state.onboarding.completed,
  );
  const authStatus = useAppSelector(state => state.auth.status);
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
      heavy: { fontFamily: 'System', fontWeight: '800' },
    },
  };
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {authStatus === 'restoring' ? (
          <Stack.Screen
            name="AppLock"
            children={() => (
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <LoadingState label="Restoring your session…" />
              </View>
            )}
          />
        ) : authStatus === 'authenticated' ? (
          isLocked ? (
            <Stack.Screen name="AppLock" component={AppLockScreen} />
          ) : (
            <Stack.Screen name="Main" component={MainTabs} />
          )
        ) : !onboardingComplete ? (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
