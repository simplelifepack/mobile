import { CenteredContent } from '../primitives/Layout';
import React, { useState } from 'react';
import { Screen } from '../primitives/Screen';
import { Stack } from '../primitives/Stack';
import { AppText } from '../primitives/AppText';
import { Button } from '../primitives/Button';
import { PinInput } from './PinInput';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { store } from '../../app/store/store';
import { unlockVerified } from '../../security/appLockSlice';
import { authApi } from '../../api/auth.api';
import { sessionStorage } from '../../api/sessionStorage';
import { setAccessToken } from '../../api/client';
import { useAction } from '../../features/shared/resourceHooks';
import { logout } from '../../features/auth/authSlice';
import { AppState } from 'react-native';
import { appLockStorage } from '../../security/appLockStorage';
export function AppLockScreen() {
  const [pin, setPin] = useState('');
  const user = useAppSelector(state => state.auth.user);
  const biometrics = useAppSelector(
    state => state.appLock?.biometrics ?? false,
  );
  const settingsError = useAppSelector(state => state.appLock?.error ?? '');
  const dispatch = useAppDispatch();
  const action = useAction();
  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const unlock = async () => {
    if (!user) throw new Error('Sign in again to unlock Readines.');
    const generation = store.getState().appLock.generation;
    const result = await authApi
      .loginWithPin({ email: user.email, pin })
      .catch(error => {
        if (error?.status === 401)
          throw new Error('Incorrect R-pin. Try again.');
        throw error;
      });
    if (!mounted.current || store.getState().auth.user?.id !== user.id) return;
    if (result.user.id !== user.id)
      throw new Error('The account changed. Please sign in again.');
    if (
      AppState.currentState === 'background' ||
      store.getState().appLock.generation !== generation
    )
      throw new Error(
        'The app moved to the background. Unlock again to continue.',
      );
    const token = result.accessToken ?? result.token;
    setAccessToken(token);
    await sessionStorage.writeAccessToken(token);
    if (mounted.current && store.getState().auth.user?.id === user.id) {
      setPin('');
      dispatch(unlockVerified({ accountId: user.id, generation }));
    }
  };
  const unlockBiometric = async () => {
    if (!user) return;
    const generation = store.getState().appLock.generation;
    await appLockStorage.authenticate(user.id);
    if (
      AppState.currentState === 'background' ||
      store.getState().appLock.generation !== generation
    )
      throw new Error(
        'The app moved to the background. Unlock again to continue.',
      );
    if (mounted.current && store.getState().auth.user?.id === user.id)
      dispatch(unlockVerified({ accountId: user.id, generation }));
  };
  const attemptedBiometry = React.useRef(false);
  React.useEffect(() => {
    if (!biometrics || !user?.id) return;
    const attempt = () => {
      if (AppState.currentState !== 'active' || attemptedBiometry.current)
        return;
      attemptedBiometry.current = true;
      action.run(unlockBiometric, '');
    };
    const frame = requestAnimationFrame(attempt);
    const listener = AppState.addEventListener('change', next => {
      if (next === 'active') attempt();
    });
    return () => {
      cancelAnimationFrame(frame);
      listener.remove();
    };
    // One automatic attempt per lock screen. Cancellation requires an explicit retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometrics, user?.id]);
  return (
    <Screen>
      <CenteredContent gap="xl">
        <Stack gap="sm" align="center">
          <AppText variant="title">Unlock Readines</AppText>
          <AppText color="secondary" align="center">
            {biometrics
              ? 'Verify with biometrics or enter your six-digit R-pin.'
              : 'Enter your six-digit R-pin.'}
          </AppText>
        </Stack>
        <PinInput value={pin} onChange={setPin} autoFocus={!biometrics} />
        {settingsError ? (
          <AppText color="secondary">{settingsError}</AppText>
        ) : null}
        {biometrics ? (
          <Button
            title="Unlock with biometrics"
            disabled={action.busy}
            onPress={() => {
              attemptedBiometry.current = true;
              action.run(unlockBiometric, '');
            }}
          />
        ) : null}
        {action.message ? (
          <AppText color="danger">{action.message}</AppText>
        ) : null}
        <Button
          title="Use PIN"
          variant="secondary"
          disabled={pin.length !== 6 || action.busy}
          onPress={() => {
            action.run(unlock, '');
          }}
        />
        <Button
          title="Sign out"
          variant="ghost"
          disabled={action.busy}
          onPress={() => {
            dispatch(logout());
          }}
        />
      </CenteredContent>
    </Screen>
  );
}
