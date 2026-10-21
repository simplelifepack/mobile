import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../../components/primitives/AppText';
import { Row } from '../../components/primitives/Row';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { authApi } from '../../api/auth.api';
import { cleanPin } from '../auth/auth.validators';

type Mode = 'change' | 'reset';

export function PinChangeModal({
  visible,
  onClose,
  onChanged,
}: {
  visible: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { theme } = useAppTheme();
  const [mode, setMode] = useState<Mode>('change');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [otp, setOtp] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const close = () => {
    setMode('change');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setOtp('');
    setCodeSent(false);
    setError(undefined);
    onClose();
  };

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setBusy(true);
    setError(undefined);
    try {
      await action();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : fallback);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async () => {
    if (await run(() => authApi.requestPinReset(), 'Unable to send code.')) {
      setCodeSent(true);
    }
  };

  const submit = async () => {
    if (mode === 'change' && !/^\d{6}$/.test(currentPin)) {
      return setError('Enter your current 6-digit R-pin.');
    }
    if (mode === 'reset' && !/^\d{6}$/.test(otp)) {
      return setError('Enter the 6-digit email code.');
    }
    if (!/^\d{6}$/.test(newPin)) return setError('Enter a 6-digit R-pin.');
    if (newPin !== confirmPin) return setError('R-pins do not match.');
    if (mode === 'change' && currentPin === newPin) {
      return setError('New R-pin must be different from your current R-pin.');
    }
    const ok = await run(
      () =>
        mode === 'change'
          ? authApi.changePin({ currentPin, newPin })
          : authApi.resetPin({ otp, newPin }),
      'Unable to update R-pin.',
    );
    if (ok) {
      onChanged();
      close();
    }
  };

  const showFields = mode === 'change' || codeSent;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[styles.panel, { backgroundColor: theme.colors.background }]}>
          <AppText style={styles.title}>
            {mode === 'change' ? 'Change R-pin' : 'Reset R-pin'}
          </AppText>

          {mode === 'change' ? (
            <PinField label="Current R-pin" value={currentPin} onChange={setCurrentPin} />
          ) : null}
          {mode === 'reset' && codeSent ? (
            <PinField label="6-digit email code" value={otp} onChange={setOtp} secure={false} />
          ) : null}
          {showFields ? (
            <>
              <PinField label="New R-pin" value={newPin} onChange={setNewPin} />
              <PinField label="Confirm new R-pin" value={confirmPin} onChange={setConfirmPin} />
            </>
          ) : (
            <AppText color="secondary">
              We will email a 6-digit code to verify it&apos;s you.
            </AppText>
          )}

          {error ? (
            <AppText style={styles.error} color="danger">
              {error}
            </AppText>
          ) : null}

          <Pressable
            disabled={busy}
            onPress={() => {
              setMode(mode === 'change' ? 'reset' : 'change');
              setCodeSent(false);
              setError(undefined);
            }}
          >
            <AppText color="primary">
              {mode === 'change' ? 'Forgot your R-pin?' : 'I remember my R-pin'}
            </AppText>
          </Pressable>

          <Row gap="sm" style={styles.buttons}>
            <Pressable
              onPress={close}
              style={[
                styles.button,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
              ]}
            >
              <AppText style={styles.buttonText}>Cancel</AppText>
            </Pressable>
            <Pressable
              disabled={busy}
              onPress={showFields ? submit : sendCode}
              style={[
                styles.button,
                { backgroundColor: theme.colors.primary, opacity: busy ? 0.6 : 1 },
              ]}
            >
              <AppText style={[styles.buttonText, styles.primaryText]}>
                {busy ? 'Working…' : showFields ? 'Update R-pin' : 'Send code'}
              </AppText>
            </Pressable>
          </Row>
        </View>
      </View>
    </Modal>
  );
}

function PinField({
  label,
  value,
  onChange,
  secure = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  secure?: boolean;
}) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.field}>
      <AppText style={styles.fieldLabel} color="secondary">
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={text => onChange(cleanPin(text))}
        keyboardType="number-pad"
        secureTextEntry={secure}
        maxLength={6}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            color: theme.colors.textPrimary,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.58)' },
  panel: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  title: { fontSize: 22, lineHeight: 30, fontWeight: '700' },
  field: { gap: 8 },
  fieldLabel: { fontSize: 13, lineHeight: 20 },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 11,
    fontSize: 15,
  },
  error: { fontSize: 13, lineHeight: 20 },
  buttons: { marginTop: 4 },
  button: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  buttonText: { fontSize: 15, fontWeight: '700' },
  primaryText: { color: '#07111E' },
});
