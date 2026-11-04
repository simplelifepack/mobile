import React from 'react';
import { mobileApi } from '../../../api/mobile.api';
import {
  FeaturePage,
  TextInput,
  Button,
  AppText,
  useAction,
} from '../../shared/FeatureUI';
export function ForgotPasswordScreen() {
  const [email, setEmail] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const action = useAction();
  return (
    <FeaturePage title="Reset password">
      <TextInput
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        editable={!sent}
        onChangeText={setEmail}
      />
      {!done ? (
        <>
          <Button
            title={sent ? 'Resend email code' : 'Send email code'}
            disabled={
              action.busy || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
            }
            onPress={() => {
              void action.run(async () => {
                await mobileApi.auth.forgotPasswordOtp({ email: email.trim() });
                setSent(true);
              }, 'Check your email for a reset code.');
            }}
          />
          {sent ? (
            <>
              <TextInput
                label="6-digit email code"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TextInput
                label="New password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <Button
                title="Reset password"
                disabled={
                  action.busy || !/^\d{6}$/.test(otp) || password.length < 8
                }
                onPress={() => {
                  void action.run(async () => {
                    await mobileApi.auth.resetPasswordOtp({
                      email: email.trim(),
                      otp,
                      password,
                    });
                    setDone(true);
                  }, 'Password reset. You can now return to sign in.');
                }}
              />
              <Button
                title="Use another email"
                variant="ghost"
                disabled={action.busy}
                onPress={() => {
                  setSent(false);
                  setOtp('');
                  setPassword('');
                }}
              />
            </>
          ) : null}
        </>
      ) : null}
      {action.message ? <AppText>{action.message}</AppText> : null}
    </FeaturePage>
  );
}
