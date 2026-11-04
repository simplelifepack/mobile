import React from 'react';
import { Alert } from 'react-native';
import { ErrorState } from '../../components/feedback/ErrorState';
import { KeyRound } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { changePin, requestPinReset, resetPin } from '../auth/authSlice';
import { DetailSheet } from '../shared/DetailSheet';
import { AppText, Button, TextInput } from '../shared/FeatureUI';
import { SettingsRow } from './SettingsUI';
import { pinError } from './accountValidation';
export function PinChange() {
  const [mode, setMode] = React.useState<'change' | 'reset'>();
  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const running = React.useRef(false);
  const email = useAppSelector(state => state.auth.user?.email);
  const dispatch = useAppDispatch();
  const clean = (value: string) => value.replace(/\D/g, '').slice(0, 6);
  const close = () => {
    setMode(undefined);
    setCurrent('');
    setNext('');
    setConfirm('');
    setOtp('');
    setError('');
  };
  const requestReset = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      await dispatch(requestPinReset()).unwrap();
      setMode('reset');
      setOtp('');
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Unable to send reset code.',
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  const submit = async () => {
    if (running.current) return;
    const invalid =
      pinError(next, confirm, mode === 'change' ? current : undefined) ||
      (mode === 'change' && !/^\d{6}$/.test(current)
        ? 'Enter your current 6-digit R-pin.'
        : mode === 'reset' && !/^\d{6}$/.test(otp)
          ? 'Enter the 6-digit email code.'
          : '');
    if (invalid) {
      setError(invalid);
      return;
    }
    running.current = true;
    setBusy(true);
    setError('');
    try {
      if (mode === 'change')
        await dispatch(
          changePin({ currentPin: current, newPin: next }),
        ).unwrap();
      else await dispatch(resetPin({ otp, newPin: next })).unwrap();
      close();
      Alert.alert(
        'PIN updated',
        'Use your new PIN the next time you sign in or unlock the app.',
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Unable to update R-pin.',
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return (
    <>
      <SettingsRow
        Icon={KeyRound}
        label="Change R-pin"
        description="Update your quick sign-in PIN or reset it by email"
        onPress={() => setMode('change')}
      />
      {mode ? (
        <DetailSheet
          title={mode === 'change' ? 'Change R-pin' : 'Reset R-pin'}
          busy={busy}
          onClose={close}
        >
          {mode === 'change' ? (
            <TextInput
              label="Current 6-digit R-pin"
              secureTextEntry
              keyboardType="number-pad"
              maxLength={6}
              value={current}
              onChangeText={value => setCurrent(clean(value))}
              editable={!busy}
            />
          ) : (
            <>
              <AppText>Enter the verification code sent to {email}.</AppText>
              <TextInput
                label="6-digit email code"
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                maxLength={6}
                value={otp}
                onChangeText={value => setOtp(clean(value))}
                editable={!busy}
              />
            </>
          )}
          <TextInput
            label="New 6-digit R-pin"
            secureTextEntry
            keyboardType="number-pad"
            maxLength={6}
            value={next}
            onChangeText={value => setNext(clean(value))}
            editable={!busy}
          />
          <TextInput
            label="Confirm new R-pin"
            validate={value =>
              value !== next ? 'Enter the same new 6-digit PIN again.' : ''
            }
            secureTextEntry
            keyboardType="number-pad"
            maxLength={6}
            value={confirm}
            onChangeText={value => setConfirm(clean(value))}
            editable={!busy}
          />
          {error ? <ErrorState message={error} /> : null}
          <Button
            title={busy ? 'Updating…' : 'Update R-pin'}
            disabled={
              busy ||
              Boolean(
                pinError(
                  next,
                  confirm,
                  mode === 'change' ? current : undefined,
                ),
              ) ||
              (mode === 'change'
                ? !/^\d{6}$/.test(current)
                : !/^\d{6}$/.test(otp))
            }
            onPress={() => {
              void submit();
            }}
          />
          <Button
            title={
              mode === 'change'
                ? 'Forgot R-pin? Send reset code'
                : 'Resend reset code'
            }
            variant="ghost"
            disabled={busy}
            onPress={() => {
              void requestReset();
            }}
          />
        </DetailSheet>
      ) : null}
    </>
  );
}
