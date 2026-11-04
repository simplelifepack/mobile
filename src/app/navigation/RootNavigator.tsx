import { Linking } from 'react-native';
import {
  CommonActions,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { externalDestination, type ExternalDestination } from './externalLinks';
import { ResetPasswordScreen } from '../../features/auth/screens/ResetPasswordScreen';
import { ProfileScreen } from '../../features/profile/ProfileScreen';
import { fontFamilies } from '../../design/tokens/typography';
import React from 'react';
import styled from 'styled-components/native';
import { preferencesApi } from '../../api/preferences.api';
import { PackageAdminScreen } from '../../features/admin/PackageAdminScreen';
import { HealthScreen } from '../../features/health/HealthScreen';
import { WealthScreen } from '../../features/wealth/WealthScreen';
import { TrustScreen } from '../../features/trust/TrustScreen';
import { SettingsScreen } from '../../features/settings/SettingsScreen';
import { SearchScreen } from '../../features/search/SearchScreen';
import { DocumentsScreen } from '../../features/documents/DocumentsScreen';
import { ReadinessScreen } from '../../features/readiness/ReadinessScreen';
import { InvitationScreen } from '../../features/trust/InvitationScreen';

import { NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { restoreSession } from '../../features/auth/authSlice';
import { Button } from '../../components/primitives/Button';
import { AppText } from '../../components/primitives/AppText';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { OnboardingNavigator } from './OnboardingNavigator';
import { AuthNavigator } from './AuthNavigator';
import { MainTabs } from './MainTabs';
import { AppLockScreen } from '../../components/security/AppLockScreen';
import { PinSetupScreen } from '../../features/auth/screens/PinSetupScreen';
import { StartupSplash } from '../../features/startup/StartupSplash';
import { CenteredContent } from '../../components/primitives/Layout';
import { useBootstrapQuery } from '../../services/api';
import { useAppLock } from '../../security/useAppLock';
const Stack = createNativeStackNavigator<RootStackParamList>();
const StartupPlaceholder = () => null;
const RootSurface = styled.View({ flex: 1 });
const NavigationSurface = styled.View({ flex: 1 });
const LaunchOverlay = styled.View({
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 100,
});
export function RootNavigator() {
  const dispatch = useAppDispatch();
  const navigationRef = React.useRef(
    createNavigationContainerRef<RootStackParamList>(),
  ).current;
  const [pendingLink, setPendingLink] =
    React.useState<ExternalDestination | null>(null);
  const [navigationReady, setNavigationReady] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    const receive = (url: string) => {
      const destination = externalDestination(url);
      if (active && destination) setPendingLink(destination);
    };
    const subscription = Linking.addEventListener('url', event =>
      receive(event.url),
    );
    void Linking.getInitialURL()
      .then(url => {
        if (url) receive(url);
      })
      .catch(() => undefined);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  const onboardingComplete = useAppSelector(
    state => state.onboarding.completed,
  );
  const authStatus = useAppSelector(state => state.auth.status);
  const authError = useAppSelector(state => state.auth.error);
  const user = useAppSelector(state => state.auth.user);
  const [readyForUser, setReadyForUser] = React.useState<string>();
  const onHomeReady = React.useCallback(
    () => setReadyForUser(user?.id),
    [user?.id],
  );
  const renderMain = React.useCallback(
    () => <MainTabs onInitialReady={onHomeReady} />,
    [onHomeReady],
  );
  const hasSession = authStatus === 'authenticated' || authStatus === 'expired';
  const pinConfigured = user?.pinConfigured === true;
  const lock = useAppLock(hasSession && pinConfigured ? user?.id : undefined);
  const isLocked = lock.locked;
  const lockPending = hasSession && pinConfigured && !lock.ready;
  useBootstrapQuery(undefined, {
    skip:
      authStatus !== 'authenticated' ||
      !pinConfigured ||
      lockPending ||
      isLocked,
  });
  const { theme, setMode } = useAppTheme();
  React.useEffect(() => {
    if (
      authStatus !== 'authenticated' ||
      !pinConfigured ||
      lockPending ||
      isLocked
    )
      return;
    let active = true;
    void preferencesApi
      .get()
      .then(preferences => {
        if (active) setMode(preferences.appearance);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [authStatus, pinConfigured, user?.id, setMode, lockPending, isLocked]);
  React.useEffect(() => {
    if (
      !pendingLink ||
      !navigationReady ||
      !navigationRef.isReady() ||
      authStatus === 'restoring' ||
      authStatus === 'restoreFailed' ||
      authStatus === 'expired' ||
      (authStatus === 'authenticated' && !pinConfigured) ||
      lockPending ||
      isLocked
    )
      return;
    const publicRoute = ['Invitation', 'ResetPassword'].includes(
      pendingLink.screen,
    );
    if (!publicRoute && (authStatus !== 'authenticated' || !pinConfigured))
      return;
    navigationRef.dispatch(
      CommonActions.navigate(pendingLink.screen, pendingLink.params),
    );
    setPendingLink(null);
  }, [
    pendingLink,
    navigationReady,
    navigationRef,
    authStatus,
    pinConfigured,
    lockPending,
    isLocked,
  ]);
  const navigationTheme = React.useMemo<Theme>(
    () => ({
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
        regular: { fontFamily: fontFamilies.regular, fontWeight: '400' },
        medium: { fontFamily: fontFamilies.medium, fontWeight: '500' },
        bold: { fontFamily: fontFamilies.bold, fontWeight: '600' },
        heavy: { fontFamily: fontFamilies.bold, fontWeight: '600' },
      },
    }),
    [theme],
  );
  const startupVisible =
    authStatus === 'restoring' ||
    lockPending ||
    (authStatus === 'authenticated' &&
      pinConfigured &&
      !isLocked &&
      readyForUser !== user?.id);
  return (
    <RootSurface>
      <NavigationSurface
        accessibilityElementsHidden={startupVisible}
        importantForAccessibility={
          startupVisible ? 'no-hide-descendants' : 'auto'
        }
      >
        <NavigationContainer
          ref={navigationRef}
          theme={navigationTheme}
          onReady={() => setNavigationReady(true)}
        >
          <Stack.Navigator
            key={user?.id ?? 'guest'}
            screenOptions={{ headerShown: false }}
          >
            {authStatus === 'restoreFailed' ? (
              <Stack.Screen
                name="AppLock"
                children={() => (
                  <CenteredContent>
                    <AppText accessibilityRole="alert">{authError}</AppText>
                    <Button
                      title="Retry session"
                      onPress={() => {
                        void dispatch(restoreSession());
                      }}
                    />
                  </CenteredContent>
                )}
              />
            ) : authStatus === 'restoring' || lockPending ? (
              <Stack.Screen
                name="AppLock"
                component={StartupPlaceholder}
                options={{ animation: 'none' }}
              />
            ) : authStatus === 'authenticated' && !pinConfigured ? (
              <Stack.Screen name="AppLock" component={PinSetupScreen} />
            ) : hasSession ? (
              isLocked ? (
                <Stack.Screen name="AppLock" component={AppLockScreen} />
              ) : (
                <>
                  <Stack.Screen name="Main" options={{ animation: 'none' }}>
                    {renderMain}
                  </Stack.Screen>
                  <Stack.Screen name="Profile" component={ProfileScreen} />
                  <Stack.Screen
                    name="Health"
                    component={HealthScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="Wealth"
                    component={WealthScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="Family"
                    component={TrustScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="Legacy"
                    component={TrustScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="TrustedAccess"
                    component={TrustScreen}
                    options={{ headerShown: false, title: 'Trust' }}
                  />
                  <Stack.Screen
                    name="PackageAdmin"
                    component={PackageAdminScreen}
                    options={{ headerShown: false, title: 'Package Admin' }}
                  />
                  <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="Search"
                    component={SearchScreen}
                    options={{
                      headerShown: false,
                      presentation: 'transparentModal',
                      animation: 'fade',
                    }}
                  />
                  <Stack.Screen
                    name="DocumentLibrary"
                    component={DocumentsScreen}
                    options={{ headerShown: false, title: 'Documents' }}
                  />
                  <Stack.Screen
                    name="Packages"
                    component={ReadinessScreen}
                    options={{ headerShown: false }}
                  />
                </>
              )
            ) : !onboardingComplete ? (
              <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
            ) : (
              <Stack.Screen name="Auth" component={AuthNavigator} />
            )}
            {authStatus !== 'restoring' &&
            authStatus !== 'restoreFailed' &&
            !lockPending &&
            (authStatus !== 'authenticated' || (pinConfigured && !isLocked)) ? (
              <>
                <Stack.Screen
                  name="Invitation"
                  component={InvitationScreen}
                  options={{ headerShown: false, title: 'Invitation' }}
                />
                <Stack.Screen
                  name="ResetPassword"
                  component={ResetPasswordScreen}
                  options={{ headerShown: false, title: 'Reset password' }}
                />
              </>
            ) : null}
          </Stack.Navigator>
        </NavigationContainer>
      </NavigationSurface>
      {startupVisible ? (
        <LaunchOverlay accessibilityViewIsModal>
          <StartupSplash />
        </LaunchOverlay>
      ) : null}
    </RootSurface>
  );
}
