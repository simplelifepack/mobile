import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { authApi } from '../../../api/auth.api';
import { requestPasswordReset } from '../authSlice';
import {
  cleanPin,
  validateNewPassword,
  validatePasswordResetInput,
} from '../auth.validators';
import { Screen } from '../../../components/primitives/Screen';
import { Stack } from '../../../components/primitives/Stack';
import { AppText } from '../../../components/primitives/AppText';
import { TextInput } from '../../../components/primitives/TextInput';
import { Button } from '../../../components/primitives/Button';

export function ForgotPasswordScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>) {
  const dispatch = useAppDispatch();
  const { submitting } = useAppSelector(state => state.auth);
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const sendCode = async () => {
    setMessage('');
    setError('');
    try {
      const result = await dispatch(requestPasswordReset(email)).unwrap();
      setMessage(result.message);
      setStep('reset');
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Unable to request a reset.');
    }
  };

  const resetPassword = async () => {
    setMessage('');
    setError('');
    try {
      if (!/^\d{6}$/.test(otp)) {
        throw new Error('Enter the 6-digit code from your email.');
      }
      const safePassword = validateNewPassword(password, confirm);
      setBusy(true);
      const result = await authApi.resetPasswordOtp({
        email: validatePasswordResetInput(email),
        otp,
        password: safePassword,
      });
      setMessage(result.message);
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to reset password.');
    } finally {
      setBusy(false);
    }
  };

  const working = submitting || busy;

  return (
    <Screen>
      <Stack gap="lg" style={{ paddingVertical: 32 }}>
        <AppText variant="title">Reset password</AppText>
        <AppText color="secondary">
          {step === 'email'
            ? 'Enter your email and we’ll send a 6-digit reset code.'
            : step === 'reset'
              ? 'Enter the code we emailed you and choose a new password.'
              : 'Your password has been updated.'}
        </AppText>

        {step === 'email' ? (
          <>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!working}
            />
            <Button
              title={working ? 'Sending…' : 'Send reset code'}
              disabled={working || !email.trim()}
              onPress={sendCode}
            />
          </>
        ) : null}

        {step === 'reset' ? (
          <>
            <TextInput
              label="6-digit code"
              value={otp}
              onChangeText={value => setOtp(cleanPin(value))}
              keyboardType="number-pad"
              maxLength={6}
              editable={!working}
            />
            <TextInput
              label="New password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              editable={!working}
            />
            <TextInput
              label="Confirm new password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
              editable={!working}
            />
            <Button
              title={working ? 'Updating…' : 'Reset password'}
              disabled={working || !otp || !password || !confirm}
              onPress={resetPassword}
            />
            <Button
              title="Resend code"
              variant="secondary"
              disabled={working}
              onPress={sendCode}
            />
          </>
        ) : null}

        {step === 'done' ? (
          <Button title="Back to sign in" onPress={() => navigation.navigate('Login')} />
        ) : null}

        {message ? <AppText color="secondary">{message}</AppText> : null}
        {error ? <AppText color="danger">{error}</AppText> : null}
      </Stack>
    </Screen>
  );
}
