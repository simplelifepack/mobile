import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { requestPasswordReset } from '../authSlice';
import { Screen } from '../../../components/primitives/Screen';
import { Stack } from '../../../components/primitives/Stack';
import { AppText } from '../../../components/primitives/AppText';
import { TextInput } from '../../../components/primitives/TextInput';
import { Button } from '../../../components/primitives/Button';

export function ForgotPasswordScreen() {
  const dispatch = useAppDispatch();
  const { submitting, error } = useAppSelector(state => state.auth);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [localError, setLocalError] = useState('');

  const submit = async () => {
    setMessage('');
    setLocalError('');

    try {
      const result = await dispatch(
        requestPasswordReset(email),
      ).unwrap();
      setMessage(result.message);
    } catch (e) {
      setLocalError(
        e instanceof Error ? e.message : 'Unable to request a reset.',
      );
    }
  };

  return (
    <Screen>
      <Stack gap="lg" style={{ paddingVertical: 32 }}>
        <AppText variant="title">Reset password</AppText>
        <AppText color="secondary">
          Enter your email and we’ll send reset instructions.
        </AppText>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!submitting}
        />
        <Button
          title={submitting ? 'Sending…' : 'Send reset link'}
          disabled={submitting || !email.trim()}
          onPress={submit}
        />
        {message ? <AppText color="secondary">{message}</AppText> : null}
        {(localError || error) ? (
          <AppText color="danger">{localError || error}</AppText>
        ) : null}
      </Stack>
    </Screen>
  );
}
