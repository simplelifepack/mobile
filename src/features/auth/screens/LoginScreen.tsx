import { AuthContent } from '../../../components/primitives/Layout';
import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { googleLogin, login, loginWithPin } from '../authSlice';
import { Screen } from '../../../components/primitives/Screen';
import { Stack } from '../../../components/primitives/Stack';
import { AppText } from '../../../components/primitives/AppText';
import { TextInput } from '../../../components/primitives/TextInput';
import { Button } from '../../../components/primitives/Button';
export function LoginScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'Login'>) {
  const dispatch = useAppDispatch();
  const { submitting, error } = useAppSelector(state => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [mode, setMode] = useState<'password' | 'pin'>('password');
  const cleanPin = (value: string) => value.replace(/\D/g, '').slice(0, 6);
  return (
    <Screen scroll>
      <AuthContent>
        <Stack gap="sm">
          <AppText variant="overviewTitle">Welcome back</AppText>
          <AppText color="secondary">Sign in to continue to Readines.</AppText>
        </Stack>
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!submitting}
        />
        {mode === 'password' ? (
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!submitting}
          />
        ) : (
          <TextInput
            label="6-digit PIN"
            secureTextEntry
            value={pin}
            onChangeText={value => setPin(cleanPin(value))}
            keyboardType="number-pad"
            editable={!submitting}
          />
        )}
        {error ? <AppText color="danger">{error}</AppText> : null}
        <Button
          title={
            submitting
              ? 'Signing in…'
              : mode === 'pin'
                ? 'Sign in with PIN'
                : 'Sign in'
          }
          disabled={
            submitting ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
            (mode === 'pin' ? pin.length !== 6 : !password)
          }
          onPress={() => {
            if (mode === 'pin') {
              dispatch(loginWithPin({ email: email.trim(), pin }));
            } else {
              dispatch(login({ email: email.trim(), password }));
            }
          }}
        />
        <Button
          title={mode === 'pin' ? 'Use password instead' : 'Sign in with PIN'}
          variant="ghost"
          disabled={submitting}
          onPress={() => setMode(mode === 'pin' ? 'password' : 'pin')}
        />
        <Button
          title="Continue with Google"
          variant="secondary"
          disabled={submitting}
          onPress={() => dispatch(googleLogin())}
        />
        <Button
          title="Forgot password?"
          variant="ghost"
          disabled={submitting}
          onPress={() => navigation.navigate('ForgotPassword')}
        />
        <Button
          title="Create account"
          variant="ghost"
          disabled={submitting}
          onPress={() => navigation.navigate('Signup')}
        />
      </AuthContent>
    </Screen>
  );
}
