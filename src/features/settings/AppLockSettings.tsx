import React from 'react';
import { AppState } from 'react-native';
import { LockKeyhole, Fingerprint } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { appLockStorage } from '../../security/appLockStorage';
import { lockSettingsChanged } from '../../security/appLockSlice';
import { Toggle } from '../../components/primitives/Toggle';
import { SettingsContent, SettingsRow, SettingsSection } from './SettingsUI';
import { AppText, useAction } from '../shared/FeatureUI';

export function AppLockSettings() {
  const userId = useAppSelector(state => state.auth.user?.id);
  const lock = useAppSelector(state => state.appLock);
  const dispatch = useAppDispatch();
  const action = useAction();
  const [biometry, setBiometry] = React.useState<string | null>(null);
  React.useEffect(() => {
    let active = true;
    let request = 0;
    const refresh = async () => {
      const current = ++request;
      try {
        const value = await appLockStorage.supportedBiometry();
        if (active && current === request) setBiometry(value);
      } catch {
        if (active && current === request) setBiometry(null);
      }
    };
    refresh();
    const listener = AppState.addEventListener('change', next => {
      if (next === 'active') refresh();
    });
    return () => {
      active = false;
      listener.remove();
    };
  }, []);
  const save = (enabled: boolean, biometrics: boolean) =>
    action.run(async () => {
      if (!userId) return;
      if (biometrics && !lock.biometrics)
        await appLockStorage.enableBiometry(userId);
      const saved = await appLockStorage.save(userId, { enabled, biometrics });
      dispatch(lockSettingsChanged({ accountId: userId, ...saved }));
    }, '');
  return (
    <SettingsSection title="App security">
      <SettingsRow
        Icon={LockKeyhole}
        label="App lock"
        description="Ask for your R-pin whenever you open or return to Readines. This device only."
        trailing={
          <Toggle
            accessibilityLabel="App lock"
            value={lock.enabled}
            disabled={action.busy || !lock.ready}
            onValueChange={value => {
              save(value, value && lock.biometrics);
            }}
          />
        }
      />
      <SettingsRow
        Icon={Fingerprint}
        label="Biometric unlock"
        description={
          biometry
            ? `Use ${biometry} instead of your R-pin. Your R-pin remains available.`
            : 'Tap to check availability. Set up Face ID or fingerprint recognition in device Settings first.'
        }
        trailing={
          <Toggle
            accessibilityLabel="Biometric unlock"
            value={lock.biometrics}
            disabled={action.busy || !lock.ready}
            onValueChange={value => {
              save(true, value);
            }}
          />
        }
      />
      {action.message ? (
        <SettingsContent>
          <AppText color="danger">{action.message}</AppText>
        </SettingsContent>
      ) : null}
    </SettingsSection>
  );
}
