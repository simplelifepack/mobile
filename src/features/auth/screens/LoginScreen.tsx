import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { ArrowRight, Eye, EyeOff } from 'lucide-react-native';

import type { AuthStackParamList } from '../../../app/navigation/types';
import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import { Screen } from '../../../components/primitives/Screen';
import { AppText } from '../../../components/primitives/AppText';
import { BrandMark } from '../../../components/BrandMark';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import {
  clearAuthError,
  googleLogin,
  login,
  loginWithPin,
} from '../authSlice';
import { cleanPin, validateLoginInput } from '../auth.validators';
import { fontSize, lineHeight } from '../../../design/tokens/typography';
import { radius } from '../../../design/tokens/radius';

export function LoginScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, 'Login'>) {
  const { theme } = useAppTheme();
  const dispatch = useAppDispatch();
  const { submitting, error: authError } = useAppSelector(state => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [mode, setMode] = useState<'password' | 'pin'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [localError, setLocalError] = useState('');

  const submitLogin = async () => {
    setLocalError('');
    dispatch(clearAuthError());
    try {
      if (mode === 'pin') {
        await dispatch(loginWithPin({ email, pin })).unwrap();
      } else {
        await dispatch(login(validateLoginInput({ email, password }))).unwrap();
      }
    } catch (submitError) {
      setLocalError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to sign in.',
      );
    }
  };

  const displayedError = localError || authError;

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.container}>
            <View style={styles.brandSection}>
              <View style={styles.logoMark}>
                <BrandMark size={70} color={theme.colors.text.primary} />
              </View>
              <AppText variant="title" style={styles.brandName}>
                ReadiNes
              </AppText>
              <AppText
                variant="body"
                color="secondary"
                align="center"
                style={styles.tagline}
              >
                Be ready for life&apos;s important moments.
              </AppText>
            </View>

            <View
              style={[
                styles.modeContainer,
                {
                  backgroundColor: theme.colors.surface.default,
                  borderColor: theme.colors.border.default,
                },
              ]}
            >
              <View
                style={[
                  styles.modeButton,
                  { backgroundColor: theme.colors.surface.raised },
                ]}
              >
                <AppText variant="heading" color="primary" style={styles.modeText}>
                  Sign in
                </AppText>
              </View>
              <View style={[styles.modeDivider, { backgroundColor: theme.colors.border.default }]} />
              <Pressable
                accessibilityRole="button"
                disabled={submitting}
                onPress={() => navigation.navigate('Signup')}
                style={styles.modeButton}
              >
                <AppText variant="heading" color="secondary" style={styles.modeText}>
                  Create account
                </AppText>
              </Pressable>
            </View>

            <View style={styles.form}>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.colors.surface.raised,
                    borderColor: emailFocused ? theme.colors.border.interactive : theme.colors.border.default,
                  },
                ]}
              >
                <TextInput
                  value={email}
                  onChangeText={value => {
                    setEmail(value);
                    setLocalError('');
                    if (authError) dispatch(clearAuthError());
                  }}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="Email"
                  placeholderTextColor={theme.colors.text.tertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  editable={!submitting}
                  returnKeyType="next"
                  style={[styles.input, { color: theme.colors.text.primary }]}
                />
              </View>

              {mode === 'pin' ? (
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.colors.surface.raised,
                    borderColor: passwordFocused ? theme.colors.border.interactive : theme.colors.border.default,
                  },
                ]}
              >
                <TextInput
                  value={pin}
                  onChangeText={value => {
                    setPin(cleanPin(value));
                    setLocalError('');
                    if (authError) dispatch(clearAuthError());
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="6-digit R-pin"
                  placeholderTextColor={theme.colors.text.tertiary}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={6}
                  editable={!submitting}
                  returnKeyType="done"
                  onSubmitEditing={submitLogin}
                  style={[styles.input, { color: theme.colors.text.primary }]}
                />
              </View>
              ) : (
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.colors.surface.raised,
                    borderColor: passwordFocused ? theme.colors.border.interactive : theme.colors.border.default,
                  },
                ]}
              >
                <TextInput
                  value={password}
                  onChangeText={value => {
                    setPassword(value);
                    setLocalError('');
                    if (authError) dispatch(clearAuthError());
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="Password"
                  placeholderTextColor={theme.colors.text.tertiary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  editable={!submitting}
                  returnKeyType="done"
                  onSubmitEditing={submitLogin}
                  style={[styles.input, styles.passwordInput, { color: theme.colors.text.primary }]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  onPress={() => setShowPassword(value => !value)}
                  hitSlop={8}
                  style={styles.passwordToggle}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={theme.colors.text.secondary} />
                  ) : (
                    <Eye size={20} color={theme.colors.text.secondary} />
                  )}
                </Pressable>
              </View>
              )}

              {displayedError ? (
                <AppText variant="caption" color="danger" style={styles.error}>
                  {displayedError}
                </AppText>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={mode === 'pin' ? 'Sign in with R-pin' : 'Sign in'}
                disabled={submitting}
                onPress={submitLogin}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: theme.colors.action.primary.default },
                  pressed && styles.pressed,
                  submitting && styles.disabled,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={theme.colors.text.onBrand} />
                ) : (
                  <>
                    <AppText variant="heading" color="onPrimary" style={styles.primaryButtonText}>
                      Sign in
                    </AppText>
                    <ArrowRight size={21} color={theme.colors.text.onBrand} strokeWidth={2} />
                  </>
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={submitting}
                onPress={() => dispatch(googleLogin())}
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: theme.colors.surface.default,
                    borderColor: theme.colors.border.default,
                  },
                ]}
              >
                <AppText variant="label">Continue with Google</AppText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={submitting}
                onPress={() => {
                  setMode(value => (value === 'pin' ? 'password' : 'pin'));
                  setLocalError('');
                  dispatch(clearAuthError());
                }}
                style={styles.textAction}
              >
                <AppText variant="label" color="primary">
                  {mode === 'pin' ? 'Use password instead' : 'Sign in with R-pin'}
                </AppText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={submitting}
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.textAction}
              >
                <AppText variant="label" color="primary">Forgot password?</AppText>
              </Pressable>

              <AppText
                variant="caption"
                color="secondary"
                align="center"
                style={styles.securityText}
              >
                Your documents stay encrypted on your device.
              </AppText>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  container: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoMark: {
    width: 58,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandName: {
    fontSize: fontSize.displayMd,
    lineHeight: lineHeight.displayMd,
    fontWeight: '700',
  },
  tagline: {
    marginTop: 8,
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
  },
  modeContainer: {
    minHeight: 54,
    width: '100%',
    borderWidth: 1,
    borderRadius: radius.surface,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  modeDivider: {
    width: 1,
  },
  modeText: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    minHeight: 54,
    borderRadius: radius.surface,
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    minHeight: 52,
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    paddingVertical: 0,
  },
  passwordInput: {
    paddingRight: 8,
  },
  passwordToggle: {
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    marginTop: -4,
    marginBottom: 12,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: radius.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: radius.surface,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  textAction: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityText: {
    marginTop: 20,
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.65,
  },
});
