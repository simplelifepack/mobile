import React from 'react';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { logout } from '../auth/authSlice';
import { api } from '../../services/api';
export function ProfileScreen() {
  const dispatch = useAppDispatch();
  const { user, submitting } = useAppSelector(state => state.auth);
  const signOut = async () => {
    await dispatch(logout());
    dispatch(api.util.resetApiState());
  };
  return (
    <Screen>
      <Stack gap="lg" style={{ paddingTop: 24 }}>
        <AppText variant="title">Profile</AppText>
        {user ? (
          <Stack gap="xs">
            <AppText variant="heading">{user.name}</AppText>
            <AppText color="secondary">{user.email}</AppText>
          </Stack>
        ) : null}
        <Button
          title={submitting ? 'Signing out…' : 'Sign out'}
          variant="danger"
          disabled={submitting}
          onPress={signOut}
        />
      </Stack>
    </Screen>
  );
}
