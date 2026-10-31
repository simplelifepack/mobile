import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View, KeyboardAvoidingView } from 'react-native';

import { AppText } from '../../components/primitives/AppText';
import { Row } from '../../components/primitives/Row';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { authApi } from '../../api/auth.api';

type CredentialKind = 'email' | 'password';

type CredentialChangeModalProps = {
  kind?: CredentialKind;
  email: string;
  onClose: () => void;
  onEmailChanged: () => void;
  onPasswordChanged: () => void;
};

export function CredentialChangeModal({
  kind,
  email,
  onClose,
  onEmailChanged,
  onPasswordChanged,
}: CredentialChangeModalProps) {
  const { theme } = useAppTheme();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (kind) return;
    setStep('form');
    setNewEmail('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setOtp('');
    setError(undefined);
  }, [kind]);

  const requestCode = async () => {
    if (
      kind === 'email' &&
      (!newEmail.includes('@') || newEmail.toLowerCase() === email.toLowerCase())
    ) {
      setError('Enter a valid email different from your current email.');
      return;
    }

    if (
      kind === 'password' &&
      (newPassword.length < 8 || newPassword !== confirmPassword)
    ) {
      setError('Use at least 8 characters and make sure both new passwords match.');
      return;
    }

    setBusy(true);
    setError(undefined);
    try {
      if (kind === 'email') {
        await authApi.requestEmailChange({ newEmail, currentPassword });
      } else {
        await authApi.requestPasswordChange({ currentPassword, newPassword });
      }
      setStep('otp');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to request verification code.',
      );
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit verification code.');
      return;
    }

    setBusy(true);
    setError(undefined);
    try {
      if (kind === 'email') {
        await authApi.verifyEmailChange({ otp });
        onEmailChanged();
      } else {
        await authApi.verifyPasswordChange({ otp });
        onPasswordChanged();
      }
      onClose();
    } catch (verifyError) {
      setError(
        verifyError instanceof Error
          ? verifyError.message
          : 'Unable to verify code.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={Boolean(kind)}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView behavior="padding" style={styles.backdrop}>
        <View style={[styles.panel, { backgroundColor: theme.colors.background }]}>
          <AppText style={styles.title}>
            {step === 'otp'
              ? 'Verify change'
              : kind === 'email'
                ? 'Change email'
                : 'Change password'}
          </AppText>

          {step === 'form' && kind === 'email' ? (
            <PreferenceField
              label="New email"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          ) : null}

          {step === 'form' && kind === 'password' ? (
            <>
              <PreferenceField
                label="Current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
              />
              <PreferenceField
                label="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <PreferenceField
                label="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </>
          ) : null}

          {step === 'otp' ? (
            <PreferenceField
              label="6-digit code"
              value={otp}
              onChangeText={value => setOtp(value.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
            />
          ) : null}

          {kind === 'email' && step === 'form' ? (
            <PreferenceField
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
          ) : null}

          {error ? (
            <AppText style={styles.error} color="danger">
              {error}
            </AppText>
          ) : null}

          <Row gap="sm" style={styles.buttons}>
            <Pressable
              onPress={onClose}
              style={[
                styles.button,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <AppText style={styles.buttonText}>Cancel</AppText>
            </Pressable>
            <Pressable
              disabled={busy}
              onPress={step === 'form' ? requestCode : verify}
              style={[
                styles.button,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: busy ? 0.6 : 1,
                },
              ]}
            >
              <AppText style={[styles.buttonText, styles.primaryText]}>
                {busy ? 'Working…' : step === 'form' ? 'Send code' : 'Verify'}
              </AppText>
            </Pressable>
          </Row>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PreferenceField({
  label,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.field}>
      <AppText style={styles.fieldLabel} color="secondary">
        {label}
      </AppText>
      <TextInput
        {...props}
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
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  panel: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  title: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    lineHeight: 20,
  },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 11,
    fontSize: 15,
  },
  error: {
    fontSize: 13,
    lineHeight: 20,
  },
  buttons: {
    marginTop: 4,
  },
  button: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  primaryText: {
    color: '#07111E',
  },
});