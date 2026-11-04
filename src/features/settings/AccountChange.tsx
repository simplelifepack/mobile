import { passwordError } from './accountValidation';
import React from 'react';
import { Alert } from 'react-native';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Lock, Mail } from 'lucide-react-native';
import { mobileApi } from '../../api/mobile.api';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { api } from '../../services/api';
import { logout, restoreSession } from '../auth/authSlice';
import { DetailSheet } from '../shared/DetailSheet';
import { AppText, Button, TextInput } from '../shared/FeatureUI';
import { SettingsRow } from './SettingsUI';
export function AccountChange({ kind }: { kind: 'email' | 'password' }) {
  const [step, setStep] = React.useState<'details' | 'code'>();
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [value, setValue] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [cooldownUntil, setCooldownUntil] = React.useState(0);
  const [tick, setTick] = React.useState(Date.now);
  const cooldown = Math.max(0, Math.ceil((cooldownUntil - tick) / 1000));
  const currentEmail = useAppSelector(state => state.auth.user?.email ?? '');
  const dispatch = useAppDispatch();
  const running = React.useRef(false);
  React.useEffect(() => {
    if (!step || !cooldownUntil) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setTick(now);
      if (now >= cooldownUntil) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, cooldownUntil]);
  const close = () => {
    setStep(undefined);
    setCurrentPassword('');
    setValue('');
    setConfirm('');
    setOtp('');
    setError('');
    setCooldownUntil(0);
  };
  const request = async () => {
    if (running.current || (step === 'code' && cooldown > 0)) return;
    if (!currentPassword) {
      setError('Enter your current password.');
      return;
    }
    if (kind === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        setError('Enter a valid email address.');
        return;
      }
      if (value.trim().toLowerCase() === currentEmail.toLowerCase()) {
        setError('Enter a different email address.');
        return;
      }
    } else {
      const rule = passwordError(value);
      if (rule) {
        setError(rule);
        return;
      }
      if (value !== confirm) {
        setError('Passwords do not match.');
        return;
      }
      if (value === currentPassword) {
        setError('Choose a different password.');
        return;
      }
    }
    running.current = true;
    setBusy(true);
    setError('');
    try {
      if (kind === 'email')
        await mobileApi.auth.requestEmailChange({
          currentPassword,
          newEmail: value.trim(),
        });
      else
        await mobileApi.auth.requestPasswordChange({
          currentPassword,
          newPassword: value,
        });
      setOtp('');
      setStep('code');
      setTick(Date.now());
      setCooldownUntil(Date.now() + 60000);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to send verification code.',
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  const verify = async () => {
    if (running.current || !/^\d{6}$/.test(otp)) return;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      if (kind === 'email') {
        await mobileApi.auth.verifyEmailChange({ otp });
        await dispatch(restoreSession()).unwrap();
      } else {
        await mobileApi.auth.verifyPasswordChange({ otp });
        await dispatch(logout());
        dispatch(api.util.resetApiState());
      }
      close();
      Alert.alert(
        kind === 'email' ? 'Email updated' : 'Password updated',
        kind === 'email'
          ? 'Use your new email the next time you sign in.'
          : 'Sign in again with your new password to continue.',
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Unable to verify code.',
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  const label = kind === 'email' ? 'Change email' : 'Change password';
  return (
    <>
      <SettingsRow
        Icon={kind === 'email' ? Mail : Lock}
        label={label}
        description={
          kind === 'email'
            ? currentEmail
            : 'Update your password with email verification'
        }
        onPress={() => setStep('details')}
      />
      {step ? (
        <DetailSheet
          title={step === 'code' ? `Verify ${kind} change` : label}
          busy={busy}
          onClose={close}
        >
          {step === 'details' ? (
            <>
              <TextInput
                label="Current password"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                editable={!busy}
                autoCapitalize="none"
              />
              <TextInput
                label={kind === 'email' ? 'New email' : 'New password'}
                secureTextEntry={kind === 'password'}
                validate={kind === 'password' ? passwordError : undefined}
                keyboardType={kind === 'email' ? 'email-address' : 'default'}
                autoCapitalize="none"
                autoCorrect={false}
                value={value}
                onChangeText={setValue}
                editable={!busy}
              />
              {kind === 'password' ? (
                <TextInput
                  label="Confirm new password"
                  validate={next =>
                    next !== value ? 'Enter the same new password again.' : ''
                  }
                  secureTextEntry
                  value={confirm}
                  onChangeText={setConfirm}
                  editable={!busy}
                  autoCapitalize="none"
                />
              ) : null}
            </>
          ) : (
            <>
              <AppText>
                Enter the verification code sent to {currentEmail}.
              </AppText>
              <TextInput
                label="6-digit email code"
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                maxLength={6}
                value={otp}
                onChangeText={text =>
                  setOtp(text.replace(/\D/g, '').slice(0, 6))
                }
                editable={!busy}
              />
            </>
          )}
          {error ? <ErrorState message={error} /> : null}
          <Button
            title={
              busy
                ? 'Please wait…'
                : step === 'details'
                  ? 'Send verification code'
                  : 'Verify change'
            }
            disabled={
              busy ||
              (step === 'code'
                ? !/^\d{6}$/.test(otp)
                : !currentPassword ||
                  (kind === 'email'
                    ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ||
                      value.trim().toLowerCase() === currentEmail.toLowerCase()
                    : Boolean(passwordError(value)) || value !== confirm))
            }
            onPress={() => {
              void (step === 'details' ? request() : verify());
            }}
          />
          {step === 'code' ? (
            <Button
              title={cooldown ? `Resend in ${cooldown}s` : 'Resend code'}
              variant="ghost"
              disabled={busy || cooldown > 0}
              onPress={() => {
                void request();
              }}
            />
          ) : null}
        </DetailSheet>
      ) : null}
    </>
  );
}
