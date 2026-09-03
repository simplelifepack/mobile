import React, { useState } from 'react';
import { authService } from '../services/authService';
import { Screen } from '../../../components/primitives/Screen';
import { Stack } from '../../../components/primitives/Stack';
import { AppText } from '../../../components/primitives/AppText';
import { TextInput } from '../../../components/primitives/TextInput';
import { Button } from '../../../components/primitives/Button';
export function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const result = await authService.requestPasswordReset(email.trim());
      setMessage(result.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to request a reset.');
    } finally {
      setLoading(false);
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
          editable={!loading}
        />
        <Button
          title={loading ? 'Sending…' : 'Send reset link'}
          disabled={loading || !email.trim()}
          onPress={submit}
        />
        {message ? <AppText color="secondary">{message}</AppText> : null}
        {error ? <AppText color="danger">{error}</AppText> : null}
      </Stack>
    </Screen>
  );
}
