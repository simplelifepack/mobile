import React, { useState } from 'react';
import { useAppDispatch } from '../../../app/store/hooks';
import { authApi } from '../../../api/auth.api';
import { api } from '../../../services/api';
import { cleanPin } from '../auth.validators';
import { logout, restoreSession, updateCurrentUser } from '../authSlice';
import { Screen } from '../../../components/primitives/Screen';
import { Stack } from '../../../components/primitives/Stack';
import { AppText } from '../../../components/primitives/AppText';
import { TextInput } from '../../../components/primitives/TextInput';
import { Button } from '../../../components/primitives/Button';

export function PinSetupScreen({ email }: { email?: string }) {
  const dispatch = useAppDispatch();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    if (!/^\d{6}$/.test(pin)) return setError('Enter a 6-digit R-pin.');
    if (pin !== confirmPin) return setError('R-pins do not match.');
    setBusy(true);
    try {
      const result = await authApi.setupPin(pin);
      dispatch(updateCurrentUser(result.user));
    } catch (e) {
      if (e instanceof Error && /already configured/i.test(e.message)) {
        await dispatch(restoreSession());
        return;
      }
      setError(e instanceof Error ? e.message : 'Unable to create R-pin.');
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    await dispatch(logout());
    dispatch(api.util.resetApiState());
  };

  return (
    <Screen>
      <Stack gap="lg" style={{ paddingVertical: 32 }}>
        <AppText variant="title">Create your R-pin</AppText>
        <AppText color="secondary">
          Add a 6-digit R-pin for {email ?? 'your account'} before continuing.
        </AppText>
        <TextInput
          label="R-pin"
          value={pin}
          onChangeText={value => setPin(cleanPin(value))}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          editable={!busy}
        />
        <TextInput
          label="Confirm R-pin"
          value={confirmPin}
          onChangeText={value => setConfirmPin(cleanPin(value))}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          editable={!busy}
        />
        {error ? <AppText color="danger">{error}</AppText> : null}
        <Button
          title={busy ? 'Saving…' : 'Continue'}
          disabled={busy || pin.length !== 6 || confirmPin.length !== 6}
          onPress={submit}
        />
        <Button title="Sign out" variant="ghost" onPress={signOut} />
      </Stack>
    </Screen>
  );
}
