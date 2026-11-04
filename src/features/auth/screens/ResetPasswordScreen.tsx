import React from 'react';
import { mobileApi } from '../../../api/mobile.api';
import {
  FeaturePage,
  TextInput,
  AppText,
  Button,
  useAction,
} from '../../shared/FeatureUI';

export function ResetPasswordScreen({
  route,
}: {
  route: { params: { token: string } };
}) {
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [done, setDone] = React.useState(false);
  const action = useAction();
  return (
    <FeaturePage title="Reset password">
      {done ? (
        <AppText>Your password was reset. Return to sign in.</AppText>
      ) : (
        <>
          <TextInput
            label="New password"
            validate={value =>
              value.length < 8 ? 'Use at least 8 characters.' : ''
            }
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!action.busy}
          />
          <TextInput
            label="Confirm new password"
            validate={value =>
              value !== password ? 'Enter the same password again.' : ''
            }
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            editable={!action.busy}
          />
          <Button
            title="Reset password"
            disabled={
              action.busy || password.length < 8 || password !== confirm
            }
            onPress={() => {
              void action.run(async () => {
                if (password.length < 8 || password !== confirm)
                  throw new Error(
                    'Use at least 8 characters and matching passwords.',
                  );
                await mobileApi.auth.resetPassword({
                  token: route.params.token,
                  password,
                });
                setDone(true);
                setPassword('');
                setConfirm('');
              }, 'Password reset.');
            }}
          />
        </>
      )}
      {action.message ? <AppText>{action.message}</AppText> : null}
    </FeaturePage>
  );
}
