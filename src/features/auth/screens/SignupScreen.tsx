import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { googleLogin, signup } from '../authSlice';
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
  const [localError, setLocalError] = useState('');
  const submit = () => {
    setLocalError('');
    if (password.length < 8)
      return setLocalError('Password must be at least 8 characters.');
    if (password !== confirmPassword)
      return setLocalError('Passwords do not match.');
    dispatch(signup({ name: name.trim(), email: email.trim(), password }));
  };
  return (
    <Screen scroll>
      <Stack gap="lg" style={{ paddingVertical: 32 }}>
        <AppText variant="title">Create your account</AppText>
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
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!submitting}
        />
        <TextInput
          label="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!submitting}
        />
        {localError || error ? (
          <AppText color="danger">{localError || error}</AppText>
        ) : null}
        <Button
          title={submitting ? 'Creating account…' : 'Create account'}
          disabled={submitting || !name.trim() || !email.trim() || !password}
          onPress={submit}
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
      </Stack>
    </Screen>
  );
}
