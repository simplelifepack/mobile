import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { googleLogin, login } from '../authSlice';
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
  return (
    <Screen scroll>
      <Stack gap="lg" style={{ paddingVertical: 32 }}>
        <Stack gap="sm">
          <AppText variant="title">Welcome back</AppText>
          <AppText color="secondary">Sign in to continue to Readiness.</AppText>
        </Stack>
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
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!submitting}
        />
        {error ? <AppText color="danger">{error}</AppText> : null}
        <Button
          title={submitting ? 'Signing in…' : 'Sign in'}
          disabled={submitting || !email.trim() || !password}
          onPress={() => dispatch(login({ email: email.trim(), password }))}
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
      </Stack>
    </Screen>
  );
}
