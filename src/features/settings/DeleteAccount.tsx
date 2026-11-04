import React from 'react';
import { Trash2 } from 'lucide-react-native';
import { mobileApi } from '../../api/mobile.api';
import { useAppDispatch } from '../../app/store/hooks';
import { logout } from '../auth/authSlice';
import { api } from '../../services/api';
import { DetailSheet } from '../shared/DetailSheet';
import { AppText, Button, TextInput } from '../shared/FeatureUI';
import { SettingsRow } from './SettingsUI';
export function DeleteAccount() {
  const [step, setStep] = React.useState<'warning' | 'confirm'>();
  const [phrase, setPhrase] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const dispatch = useAppDispatch();
  const running = React.useRef(false);
  const remove = async () => {
    if (running.current || phrase !== 'delete my account') return;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      await mobileApi.account.scheduleDeletion(phrase);
      await dispatch(logout());
      dispatch(api.util.resetApiState());
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Unable to schedule deletion.',
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return (
    <>
      <SettingsRow
        Icon={Trash2}
        label="Delete account"
        danger
        description="Schedule permanent deletion after 30 days"
        onPress={() => {
          setPhrase('');
          setError('');
          setStep('warning');
        }}
      />
      {step ? (
        <DetailSheet
          title={
            step === 'warning'
              ? 'Delete your account?'
              : 'Schedule account deletion'
          }
          busy={busy}
          onClose={() => setStep(undefined)}
        >
          <AppText>
            Your account will be scheduled for permanent deletion in 30 days.
            Signing in during those 30 days cancels the request.
          </AppText>
          <AppText>
            This includes your documents, Health and Wealth records, family
            information, analytics, preferences and uploaded files. After
            deletion there is no application backup or recovery copy.
          </AppText>
          {step === 'warning' ? (
            <Button
              title="Continue"
              variant="danger"
              onPress={() => setStep('confirm')}
            />
          ) : (
            <>
              <TextInput
                label="Type delete my account to confirm"
                autoCapitalize="none"
                autoCorrect={false}
                value={phrase}
                onChangeText={setPhrase}
                editable={!busy}
              />
              {error ? <AppText color="danger">{error}</AppText> : null}
              <Button
                title={busy ? 'Scheduling…' : 'Schedule account deletion'}
                variant="danger"
                disabled={busy || phrase !== 'delete my account'}
                onPress={() => {
                  void remove();
                }}
              />
            </>
          )}
        </DetailSheet>
      ) : null}
    </>
  );
}
