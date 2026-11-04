import { AuthContent } from '../../../components/primitives/Layout';
import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { googleLogin, requestSignupOtp, signup } from '../authSlice';
import { Screen } from '../../../components/primitives/Screen';
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
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [localError, setLocalError] = useState('');
  const submit = () => {
    setLocalError('');
    if (password.length < 8)
      return setLocalError('Password must be at least 8 characters.');
    if (password !== confirmPassword)
      return setLocalError('Passwords do not match.');
    dispatch(
      requestSignupOtp({ name: name.trim(), email: email.trim(), password }),
    )
      .unwrap()
      .then(() => setStep('otp'))
      .catch(() => undefined);
  };
  const verify = () => {
    setLocalError('');
    if (!/^\d{6}$/.test(otp))
      return setLocalError('Enter the 6-digit code from your email.');
    dispatch(signup({ name: name.trim(), email: email.trim(), password, otp }));
  };
  return (
    <Screen scroll>
      <AuthContent>
        <AppText variant="overviewTitle">Create your account</AppText>
        {step === 'form' ? (
          <>
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              editable={!submitting}
            />
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!submitting}
            />
            <TextInput
              label="Password"
              validate={value =>
                value.length < 8 ? 'Use at least 8 characters.' : ''
              }
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!submitting}
            />
            <TextInput
              label="Confirm password"
              validate={value =>
                value !== password ? 'Enter the same password again.' : ''
              }
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              editable={!submitting}
            />
          </>
        ) : (
          <>
            <AppText color="secondary">
              Enter the 6-digit code sent to {email.trim()}.
            </AppText>
            <TextInput
              label="6-digit email code"
              value={otp}
              onChangeText={value =>
                setOtp(value.replace(/\D/g, '').slice(0, 6))
              }
              keyboardType="number-pad"
              editable={!submitting}
            />
          </>
        )}
        {localError || error ? (
          <AppText color="danger">{localError || error}</AppText>
        ) : null}
        <Button
          title={
            submitting
              ? 'Working…'
              : step === 'form'
                ? 'Send verification code'
                : 'Verify and create account'
          }
          disabled={
            submitting ||
            (step === 'form'
              ? !name.trim() ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
                password.length < 8 ||
                password !== confirmPassword
              : otp.length !== 6)
          }
          onPress={step === 'form' ? submit : verify}
        />
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
      </AuthContent>
    </Screen>
  );
}
