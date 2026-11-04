import React from 'react';
import { Alert } from 'react-native';
import { Screen } from '../../../components/primitives/Screen';
import { Stack } from '../../../components/primitives/Stack';
import { AppText } from '../../../components/primitives/AppText';
import { TextInput } from '../../../components/primitives/TextInput';
import { Button } from '../../../components/primitives/Button';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { login, loginWithPin, logout } from '../authSlice';
export function ReauthenticateScreen({ email }: { email: string }) {
  const dispatch = useAppDispatch();
  const busy = useAppSelector(state => state.auth.submitting);
  const error = useAppSelector(state => state.auth.error);
  const [mode, setMode] = React.useState<'pin' | 'password'>('pin');
  const [credential, setCredential] = React.useState('');
  const [invalid, setInvalid] = React.useState('');
  const submit = async () => {
    if (mode === 'pin' && !/^\d{6}$/.test(credential)) {
      setInvalid('Enter the 6-digit PIN for this account.');
      return;
    }
    if (!credential) {
      setInvalid('Enter your current password.');
      return;
    }
    try {
      if (mode === 'pin')
        await dispatch(loginWithPin({ email, pin: credential })).unwrap();
      else await dispatch(login({ email, password: credential })).unwrap();
      Alert.alert(
        'Signed in again',
        'Your open form is still here. Review your entries and continue.',
      );
    } catch {
      /* Keep this gate and the protected form open. */
    }
  };
  return (
    <Screen scroll>
      <Stack gap="md">
        <AppText variant="heading">Your session expired</AppText>
        <AppText>
          Your open work is protected behind this screen. Sign in to the same
          account to continue without starting over.
        </AppText>
        <AppText color="secondary">{email}</AppText>
        <TextInput
          label={mode === 'pin' ? '6-digit PIN' : 'Password'}
          secureTextEntry
          keyboardType={mode === 'pin' ? 'number-pad' : 'default'}
          value={credential}
          editable={!busy}
          error={invalid}
          onChangeText={value => {
            setInvalid('');
            setCredential(
              mode === 'pin' ? value.replace(/\D/g, '').slice(0, 6) : value,
            );
          }}
        />
        {error && !/session expired/i.test(error) ? (
          <ErrorState message={error} />
        ) : null}
        <Button
          title={busy ? 'Signing in…' : 'Sign in and resume'}
          disabled={busy}
          onPress={() => {
            void submit();
          }}
        />
        <Button
          title={mode === 'pin' ? 'Use password instead' : 'Use PIN instead'}
          variant="secondary"
          disabled={busy}
          onPress={() => {
            setCredential('');
            setInvalid('');
            setMode(mode === 'pin' ? 'password' : 'pin');
          }}
        />
        <Button
          title="Leave this account"
          variant="ghost"
          disabled={busy}
          onPress={() =>
            Alert.alert(
              'Leave your open work?',
              'Saved record drafts stay protected on this device. Other unsaved entries and selected files may need to be entered again.',
              [
                { text: 'Keep my work', style: 'cancel' },
                {
                  text: 'Sign out',
                  style: 'destructive',
                  onPress: () => {
                    void dispatch(logout());
                  },
                },
              ],
            )
          }
        />
      </Stack>
    </Screen>
  );
}
