import { AuthContent } from '../../../components/primitives/Layout';
import React, { useState } from 'react';
import { Screen } from '../../../components/primitives/Screen';
import { Stack } from '../../../components/primitives/Stack';
import { AppText } from '../../../components/primitives/AppText';
import { TextInput } from '../../../components/primitives/TextInput';
import { Button } from '../../../components/primitives/Button';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { logout, setupPin } from '../authSlice';

const cleanPin = (value: string) => value.replace(/\D/g, '').slice(0, 6);

export function PinSetupScreen() {
  const dispatch = useAppDispatch();
  const { user, submitting, error } = useAppSelector(state => state.auth);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [localError, setLocalError] = useState('');
  const submit = () => {
    setLocalError('');
    if (!/^\d{6}$/.test(pin)) return setLocalError('Enter a 6-digit PIN.');
    if (pin !== confirmPin) return setLocalError('PINs do not match.');
    dispatch(setupPin(pin));
  };
  return (
    <Screen scroll>
      <AuthContent>
        <Stack gap="sm">
          <AppText variant="title">Create your sign-in PIN</AppText>
          <AppText color="secondary">
            Add a 6-digit PIN for {user?.email ?? 'your account'} before
            continuing.
          </AppText>
        </Stack>
        <TextInput
          label="6-digit PIN"
          secureTextEntry
          value={pin}
          onChangeText={value => setPin(cleanPin(value))}
          keyboardType="number-pad"
          editable={!submitting}
        />
        <TextInput
          label="Confirm PIN"
          validate={value =>
            value !== pin ? 'Enter the same 6-digit PIN again.' : ''
          }
          secureTextEntry
          value={confirmPin}
          onChangeText={value => setConfirmPin(cleanPin(value))}
          keyboardType="number-pad"
          editable={!submitting}
        />
        {localError || error ? (
          <AppText color="danger">{localError || error}</AppText>
        ) : null}
        <Button
          title={submitting ? 'Saving…' : 'Continue'}
          disabled={submitting || pin.length !== 6 || confirmPin !== pin}
          onPress={submit}
        />
        <Button
          title="Sign out"
          variant="ghost"
          disabled={submitting}
          onPress={() => dispatch(logout())}
        />
      </AuthContent>
    </Screen>
  );
}
