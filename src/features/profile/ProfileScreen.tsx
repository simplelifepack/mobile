import { FeaturePage } from '../shared/FeatureUI';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { Stack } from '../../components/primitives/Stack';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { TextInput } from '../../components/primitives/TextInput';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import {
  changePin,
  logout,
  requestPinReset,
  resetPin,
} from '../auth/authSlice';
import { api } from '../../services/api';
export function ProfileScreen() {
  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, submitting, error } = useAppSelector(state => state.auth);
  const [pinMode, setPinMode] = React.useState<'closed' | 'change' | 'reset'>(
    'closed',
  );
  const [currentPin, setCurrentPin] = React.useState('');
  const [newPin, setNewPin] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [localError, setLocalError] = React.useState('');
  const cleanPin = (value: string) => value.replace(/\D/g, '').slice(0, 6);
  const signOut = async () => {
    await dispatch(logout());
    dispatch(api.util.resetApiState());
  };
  const submitPin = () => {
    setLocalError('');
    if (!/^\d{6}$/.test(newPin))
      return setLocalError('Enter a new 6-digit PIN.');
    if (pinMode === 'change') {
      if (!/^\d{6}$/.test(currentPin))
        return setLocalError('Enter your current 6-digit PIN.');
      dispatch(changePin({ currentPin, newPin }))
        .unwrap()
        .then(() => setPinMode('closed'))
        .catch(() => undefined);
    } else {
      if (!/^\d{6}$/.test(otp))
        return setLocalError('Enter the 6-digit email code.');
      dispatch(resetPin({ otp, newPin }))
        .unwrap()
        .then(() => setPinMode('closed'))
        .catch(() => undefined);
    }
  };
  const startReset = () => {
    setLocalError('');
    dispatch(requestPinReset())
      .unwrap()
      .then(() => setPinMode('reset'))
      .catch(() => undefined);
  };
  return (
    <FeaturePage title="Account" subtitle="Your profile and sign-in details">
      {user ? (
        <Stack gap="xs">
          <AppText variant="heading">{user.name}</AppText>
          <AppText color="secondary">{user.email}</AppText>
        </Stack>
      ) : null}
      {pinMode === 'closed' ? (
        <Button
          title="Change sign-in PIN"
          variant="secondary"
          disabled={submitting}
          onPress={() => setPinMode('change')}
        />
      ) : (
        <Stack gap="md">
          <AppText variant="heading">
            {pinMode === 'reset' ? 'Reset sign-in PIN' : 'Change sign-in PIN'}
          </AppText>
          {pinMode === 'change' ? (
            <TextInput
              label="Current PIN"
              secureTextEntry
              value={currentPin}
              onChangeText={value => setCurrentPin(cleanPin(value))}
              keyboardType="number-pad"
              editable={!submitting}
            />
          ) : (
            <TextInput
              label="6-digit email code"
              value={otp}
              onChangeText={value => setOtp(cleanPin(value))}
              keyboardType="number-pad"
              editable={!submitting}
            />
          )}
          <TextInput
            label="New PIN"
            secureTextEntry
            value={newPin}
            onChangeText={value => setNewPin(cleanPin(value))}
            keyboardType="number-pad"
            editable={!submitting}
          />
          {localError || error ? (
            <AppText color="danger">{localError || error}</AppText>
          ) : null}
          <Button
            title={submitting ? 'Saving…' : 'Save PIN'}
            disabled={
              submitting ||
              !/^\d{6}$/.test(newPin) ||
              (pinMode === 'change'
                ? !/^\d{6}$/.test(currentPin)
                : !/^\d{6}$/.test(otp))
            }
            onPress={submitPin}
          />
          <Button
            title="Forgot PIN? Send email code"
            variant="ghost"
            disabled={submitting}
            onPress={startReset}
          />
          <Button
            title="Cancel"
            variant="ghost"
            disabled={submitting}
            onPress={() => setPinMode('closed')}
          />
        </Stack>
      )}
      {user?.email.toLowerCase() === 'admin@readines.com' ? (
        <Button
          title="Package administration"
          variant="secondary"
          onPress={() => navigation.navigate('PackageAdmin')}
        />
      ) : null}
      <Button
        title="Settings and account data"
        variant="secondary"
        onPress={() => navigation.navigate('Settings')}
      />
      <Button
        title="Family"
        variant="secondary"
        onPress={() => navigation.navigate('Family')}
      />
      <Button
        title="Legacy & trusted access"
        variant="secondary"
        onPress={() => navigation.navigate('Legacy')}
      />
      <Button
        title={submitting ? 'Signing out…' : 'Sign out'}
        variant="danger"
        disabled={submitting}
        onPress={signOut}
      />
    </FeaturePage>
  );
}
