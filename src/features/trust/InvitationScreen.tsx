import React, { useEffect, useState } from 'react';
import { Alert, Pressable, TextInput } from 'react-native';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { trustApi } from '../../api/trust.api';
import type { TrustInvitation } from '../../api/types';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { Card } from '../../components/primitives/Card';
import { Row } from '../../components/primitives/Row';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';

export function InvitationScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<RouteProp<RootStackParamList, 'Invitation'>>();
  const { token } = params;
  const [invitation, setInvitation] = useState<TrustInvitation>();
  const [pin, setPin] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<string>();

  useEffect(() => {
    let active = true;
    trustApi.getInvitation(token)
      .then(value => { if (active) setInvitation(value); })
      .catch(() => { if (active) setError('Invitation expired or invalid.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const accept = async () => {
    if (!/^\d{6}$/.test(pin)) {
      setError('Enter the 6-digit PIN provided by the invitation sender.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await trustApi.acceptInvitation(token, pin);
      setDone('Invitation accepted. Your access is active.');
      setInvitation(undefined);
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : 'Invitation could not be verified.');
    } finally {
      setBusy(false);
    }
  };

  const reject = () => Alert.alert(
    'Reject invitation?',
    'You will not receive access to this Readiness account.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          setBusy(true);
          trustApi.rejectInvitation(token)
            .then(() => {
              setDone('Invitation rejected.');
              setInvitation(undefined);
            })
            .catch(rejectError => setError(rejectError instanceof Error ? rejectError.message : 'Invitation expired or invalid.'))
            .finally(() => setBusy(false));
        },
      },
    ],
  );

  if (loading) return <Screen><LoadingState fill label="Loading invitation…" /></Screen>;

  return (
    <Screen scroll>
      <Stack gap="md" style={styles.container}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={theme.colors.text.primary} />
        </Pressable>
        <Card>
          <Stack gap="md">
            <Row align="center" gap="sm">
              <ShieldCheck size={22} color={theme.colors.text.interactive} />
              <AppText variant="title">Readiness Invitation</AppText>
            </Row>
            {done ? <AppText variant="body" color="success">{done}</AppText> : null}
            {error ? <ErrorState message={error} /> : null}
            {invitation ? (
              <>
                <AppText color="secondary">
                  {invitation.ownerName} invited you to join their Readiness.
                </AppText>
                <Stack gap="xs">
                  <AppText variant="caption" color="muted">Invited person</AppText>
                  <AppText variant="label">{invitation.memberName}</AppText>
                  <AppText variant="caption" color="muted">Relationship · {invitation.relationLabel}</AppText>
                  <AppText variant="caption" color="muted">Access · {invitation.accessType.name}</AppText>
                  <AppText variant="caption" color="muted">
                    Expires · {new Date(invitation.expiresAt).toLocaleString()}
                  </AppText>
                </Stack>
                {accepting ? (
                  <Stack gap="xs">
                    <AppText variant="caption" color="secondary">
                      Enter the 6-digit PIN provided by {invitation.ownerName}
                    </AppText>
                    <TextInput
                      value={pin}
                      onChangeText={value => setPin(value.replace(/\D/g, '').slice(0, 6))}
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholder="6-digit PIN"
                      placeholderTextColor={theme.colors.text.tertiary}
                      style={[styles.input, {
                        backgroundColor: theme.colors.surface.default,
                        borderColor: theme.colors.border.default,
                        color: theme.colors.text.primary,
                      }]}
                    />
                  </Stack>
                ) : null}
                <Row gap="sm">
                  <Button
                    title={busy ? 'Working…' : accepting ? 'Verify and accept' : 'Accept'}
                    disabled={busy || (accepting && pin.length !== 6)}
                    onPress={() => accepting ? accept() : setAccepting(true)}
                  />
                  <Button
                    title="Reject"
                    variant="secondary"
                    disabled={busy}
                    onPress={reject}
                  />
                </Row>
              </>
            ) : null}
          </Stack>
        </Card>
      </Stack>
    </Screen>
  );
}

const styles = {
  container: { paddingTop: 20, paddingBottom: 32 },
  input: { minHeight: 46, paddingHorizontal: 12, borderWidth: 1, borderRadius: radius.surface },
};
