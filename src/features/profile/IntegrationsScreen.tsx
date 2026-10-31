import React, { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet } from 'react-native';
import { ArrowLeft, Cloud, Mail } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch } from '../../app/store/hooks';
import { api } from '../../services/api';
import type { RootStackParamList } from '../../app/navigation/types';
import { integrationsApi, type DriveStatus, type GmailCandidate, type GmailStatus } from '../../api/integrations.api';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { Card } from '../../components/primitives/Card';
import { Row } from '../../components/primitives/Row';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { DigiLockerCard } from '../integrations/digilocker/DigiLockerCard';
import { useAppTheme } from '../../design/theme/ThemeProvider';

type DuplicateAction = 'ignore' | 'keep_both' | 'replace';

export function IntegrationsScreen() {
  const { theme } = useAppTheme();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [gmail, setGmail] = useState<GmailStatus>();
  const [drive, setDrive] = useState<DriveStatus>();
  const [candidates, setCandidates] = useState<GmailCandidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [duplicateAction, setDuplicateAction] = useState<DuplicateAction>('ignore');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const load = async () => {
    setError(undefined);
    try {
      const [gmailStatus, driveStatus] = await Promise.all([
        integrationsApi.gmailStatus(),
        integrationsApi.driveStatus(),
      ]);
      setGmail(gmailStatus);
      setDrive(driveStatus);
      if (gmailStatus.connected) {
        const result = await integrationsApi.gmailCandidates();
        setCandidates(result.candidates);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load integrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(undefined);
    setNotice(undefined);
    try {
      await action();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Integration action failed.');
    } finally {
      setBusy(false);
    }
  };

  const connectGmail = () => run(async () => {
    const result = await integrationsApi.gmailAuthorize();
    await Linking.openURL(result.authorizationUrl);
  });

  const connectDrive = () => run(async () => {
    const result = await integrationsApi.driveAuthorize();
    await Linking.openURL(result.authorizationUrl);
  });

  const scanGmail = () => run(async () => {
    const result = await integrationsApi.gmailScan();
    const latest = await integrationsApi.gmailCandidates();
    setCandidates(latest.candidates);
    setSelectedIds([]);
    setNotice(`Found ${result.relevant} relevant attachments; ${result.needsReview} need review.`);
    await load();
  });

  const importSelected = () => run(async () => {
    const result = await integrationsApi.importGmailCandidates(selectedIds);
    setNotice(`${result.results.length} attachment${result.results.length === 1 ? '' : 's'} processed.`);
    setSelectedIds([]);
    await load();
  });

  const scanDrive = () => run(async () => {
    const result = await integrationsApi.driveScan(false, duplicateAction);
    setNotice(`Drive scan complete${typeof result.message === 'string' ? `: ${result.message}` : '.'}`);
    await load();
  });

  const toggleCandidate = (id: string) =>
    setSelectedIds(current => current.includes(id)
      ? current.filter(value => value !== id)
      : [...current, id]);

  if (loading) {
    return <Screen><LoadingState fill label="Loading integrations…" /></Screen>;
  }

  return (
    <Screen scroll onRefresh={load}>
      <Stack gap="md" style={styles.container}>
        <Row align="center" gap="sm">
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={theme.colors.textPrimary} />
          </Pressable>
          <AppText variant="title">Connections</AppText>
        </Row>
        {error ? <ErrorState message={error} /> : null}
        {notice ? <Card><AppText variant="caption" color="success">{notice}</AppText></Card> : null}

        <Card>
          <Stack gap="md">
            <Row align="center" gap="sm">
              <Mail size={21} color={theme.colors.primary} />
              <Stack gap="xs" style={styles.grow}>
                <AppText variant="heading">Gmail</AppText>
                <AppText variant="caption" color="secondary">
                  {gmail?.connected ? gmail.account ?? 'Connected' : 'Not connected'}
                </AppText>
              </Stack>
            </Row>
            {gmail?.connected ? (
              <>
                <AppText variant="caption" color="muted">
                  Last scanned: {gmail.lastScannedAt ? new Date(gmail.lastScannedAt).toLocaleString() : 'Never'}
                </AppText>
                <Row gap="sm">
                  <Button title={busy ? 'Working…' : 'Scan Gmail'} disabled={busy || gmail.scanning} onPress={scanGmail} />
                  <Button title="Disconnect" variant="secondary" disabled={busy} onPress={() => run(async () => { await integrationsApi.disconnectGmail(); setCandidates([]); await load(); })} />
                </Row>
                {candidates.map(candidate => (
                  <Pressable
                    key={candidate.id}
                    disabled={candidate.status !== 'candidate' && candidate.status !== 'needs_review'}
                    onPress={() => toggleCandidate(candidate.id)}
                    style={[styles.candidate, { borderColor: theme.colors.border }]}
                  >
                    <Row align="center" justify="space-between" gap="sm">
                      <Stack gap="xs" style={styles.grow}>
                        <AppText variant="label" numberOfLines={1}>{candidate.filename}</AppText>
                        <AppText variant="caption" color="secondary" numberOfLines={1}>
                          {candidate.sender} · {candidate.suggestedDocumentType} · {candidate.status}
                        </AppText>
                      </Stack>
                      <AppText variant="caption" color={selectedIds.includes(candidate.id) ? 'primary' : 'muted'}>
                        {selectedIds.includes(candidate.id) ? 'Selected' : 'Select'}
                      </AppText>
                    </Row>
                  </Pressable>
                ))}
                {selectedIds.length ? (
                  <Button title={`Import ${selectedIds.length} selected`} disabled={busy} onPress={importSelected} />
                ) : null}
              </>
            ) : (
              <Button title="Connect Gmail" disabled={busy} onPress={connectGmail} />
            )}
          </Stack>
        </Card>

        <Card>
          <Stack gap="md">
            <Row align="center" gap="sm">
              <Cloud size={21} color={theme.colors.primary} />
              <Stack gap="xs" style={styles.grow}>
                <AppText variant="heading">Google Drive</AppText>
                <AppText variant="caption" color="secondary">
                  {drive?.connected ? drive.account ?? 'Connected' : 'Not connected'}
                </AppText>
              </Stack>
            </Row>
            {drive?.connected ? (
              <>
                <AppText variant="caption" color="muted">
                  Last scanned: {drive.lastScannedAt ? new Date(drive.lastScannedAt).toLocaleString() : 'Never'}
                </AppText>
                <AppText variant="caption" color="secondary">Duplicate handling</AppText>
                <Row gap="xs">
                  {(['ignore', 'keep_both', 'replace'] as const).map(action => (
                    <Pressable
                      key={action}
                      onPress={() => setDuplicateAction(action)}
                      style={[styles.choice, { borderColor: duplicateAction === action ? theme.colors.primary : theme.colors.border }]}
                    >
                      <AppText variant="caption" align="center">
                        {action === 'keep_both' ? 'Keep both' : action === 'replace' ? 'Replace' : 'Ignore'}
                      </AppText>
                    </Pressable>
                  ))}
                </Row>
                <Row gap="sm">
                  <Button title={busy ? 'Working…' : 'Scan Drive'} disabled={busy || drive.scanning} onPress={scanDrive} />
                  <Button title="Disconnect" variant="secondary" disabled={busy} onPress={() => run(async () => { await integrationsApi.disconnectDrive(); await load(); })} />
                </Row>
              </>
            ) : (
              <Button title="Connect Drive" disabled={busy} onPress={connectDrive} />
            )}
          </Stack>
        </Card>

        <DigiLockerCard onImported={() => dispatch(api.util.invalidateTags(['Documents']))} />

        <Button title="Refresh connections" variant="secondary" disabled={busy} onPress={load} />
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 20, paddingBottom: 32 },
  grow: { flex: 1, minWidth: 0 },
  candidate: { padding: 12, borderWidth: 1, borderRadius: 10 },
  choice: { flex: 1, minHeight: 38, paddingHorizontal: 4, borderWidth: 1, borderRadius: 8, justifyContent: 'center' },
});
