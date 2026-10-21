import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { googleLogin, requestSignupOtp, signup } from '../authSlice';
import { validateSignupInput } from '../auth.validators';
import { Screen } from '../../../components/primitives/Screen';
import { Stack } from '../../../components/primitives/Stack';
import { AppText } from '../../../components/primitives/AppText';
import { TextInput } from '../../../components/primitives/TextInput';
import { Button } from '../../../components/primitives/Button';
export function SignupScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'Signup'>) {
  const dispatch = useAppDispatch();
  const { submitting, error } = useAppSelector(state => state.auth);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [localError, setLocalError] = useState('');

  const requestCode = async () => {
    setLocalError('');

    try {
      const safeInput = validateSignupInput({
        name,
        email,
        password,
      });

      if (password !== confirmPassword) {
        return setLocalError('Passwords do not match.');
      }

      await dispatch(requestSignupOtp(safeInput)).unwrap();
      setOtp('');
      setAwaitingOtp(true);
    } catch (validationError) {
      const message = validationError instanceof Error
        ? validationError.message
        : 'Unable to create account.';
      setLocalError(
        /already exists/i.test(message) ? 'User already exists. Log in.' : message,
      );
    }
  };

  const submit = async () => {
    if (!awaitingOtp) {
      await requestCode();
      return;
    }

    setLocalError('');
    try {
      const safeInput = validateSignupInput({ name, email, password });
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }
      if (!/^\d{6}$/.test(otp.trim())) {
        throw new Error('Enter the 6-digit code from your email.');
      }
      await dispatch(signup({ ...safeInput, otp: otp.trim() })).unwrap();
    } catch (validationError) {
      const message = validationError instanceof Error
        ? validationError.message
        : 'Unable to create account.';
      setLocalError(
        /already exists/i.test(message) ? 'User already exists. Log in.' : message,
      );
    }
  };
  return (
    <Screen scroll>
      <Stack gap="lg" style={{ paddingVertical: 32 }}>
        <AppText variant="title">Create your account</AppText>
        <TextInput
          label="Name"
          value={name}
          onChangeText={value => { setName(value); setLocalError(''); }}
          editable={!submitting}
        />
        <TextInput
          label="Email"
          value={email}
          onChangeText={value => { setEmail(value); setLocalError(''); }}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!submitting}
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={value => { setPassword(value); setLocalError(''); }}
          secureTextEntry
          editable={!submitting}
        />
        <TextInput
          label="Confirm password"
          value={confirmPassword}
          onChangeText={value => { setConfirmPassword(value); setLocalError(''); }}
          secureTextEntry
          editable={!submitting}
        />
        {awaitingOtp ? (
          <>
            <TextInput
              label="Signup code"
              value={otp}
              onChangeText={value => {
                setOtp(value.replace(/\D/g, '').slice(0, 6));
                setLocalError('');
              }}
              keyboardType="number-pad"
              maxLength={6}
              editable={!submitting}
              placeholder="6-digit code"
            />
            <AppText variant="caption" color="secondary">
              We sent a code to {email}.
            </AppText>
          </>
        ) : null}
        {localError || error ? (
          <AppText color="danger">{localError || error}</AppText>
        ) : null}
        <Button
          title={submitting
            ? 'Working…'
            : awaitingOtp
              ? 'Verify and create account'
              : 'Send signup code'}
          disabled={
            submitting ||
            !name.trim() ||
            !email.trim() ||
            !password ||
            (awaitingOtp && otp.length !== 6)
          }
          onPress={submit}
        />
        {awaitingOtp ? (
          <Button
            title="Resend signup code"
            variant="ghost"
            disabled={submitting}
            onPress={requestCode}
          />
        ) : null}
        <Button
          title="Continue with Google"
          variant="secondary"
          disabled={submitting}
          onPress={() => dispatch(googleLogin())}
        />
        <Button
          title="Already have an account? Sign in"
          variant="ghost"
          disabled={submitting}
          onPress={() => navigation.navigate('Login')}
        />
      </Stack>
    </Screen>
  );
}
