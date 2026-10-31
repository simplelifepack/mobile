import React from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { FileCheck2 } from 'lucide-react-native';
import { AppText } from '../../../components/primitives/AppText';
import { Button } from '../../../components/primitives/Button';
import { Card } from '../../../components/primitives/Card';
import { Row } from '../../../components/primitives/Row';
import { Stack } from '../../../components/primitives/Stack';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import {
  CONSENT_TEXT,
  completedReferences,
  describeDocument,
  importableDocuments,
  isConnected,
  MAX_IMPORT_BATCH,
} from './lockerState';
import { useDigiLocker } from './useDigiLocker';

export function DigiLockerCard({ onImported }: { onImported: () => void }) {
  const { theme } = useAppTheme();
  const locker = useDigiLocker(onImported);
  const { session, documents, selection, busy } = locker;
  const connected = isConnected(session);
  const importing = session?.status === 'IMPORTING';
  const completed = completedReferences(session);
  const available = importableDocuments(documents, session);
  const locked = busy || importing;

  const confirmImport = () =>
    Alert.alert(
      'Copy documents to ReadiNes?',
      `${CONSENT_TEXT}\n\n${selection.length} selected. Your AI preference and account limits apply.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Allow & Import', onPress: locker.importSelected },
      ],
    );

  return (
    <Card>
      <Stack gap="md">
        <Row align="center" gap="sm">
          <FileCheck2 size={21} color={theme.colors.primary} />
          <Stack gap="xs" style={styles.grow}>
            <AppText variant="heading">DigiLocker</AppText>
            <AppText variant="caption" color="secondary">
              {connected ? 'Connected' : 'Not connected'}
            </AppText>
          </Stack>
        </Row>

        {!connected ? (
          <>
            <AppText variant="caption" color="muted">
              Sign in on DigiLocker and authorize access, then return to the app to choose documents.
              Aadhaar and formats without a PDF download cannot be imported.
            </AppText>
            <Button
              title="Connect DigiLocker"
              disabled={busy || !locker.configured}
              onPress={locker.connect}
            />
          </>
        ) : (
          <>
            <Row gap="sm">
              <Button
                title={available.length > MAX_IMPORT_BATCH ? 'Select first 50' : 'Select all'}
                variant="secondary"
                disabled={locked || !available.length}
                onPress={locker.selectAll}
              />
              <Button title="Clear" variant="secondary" disabled={locked} onPress={locker.clearSelection} />
            </Row>
            {documents.length === 0 ? (
              <AppText variant="caption" color="muted">
                DigiLocker returned no issued documents for this authorization.
              </AppText>
            ) : null}
            {documents.map(doc => {
              const progress = session?.progress.find(item => item.reference === doc.reference);
              const disabled = locked || !doc.available || completed.has(doc.reference);
              const selected = selection.includes(doc.reference);
              return (
                <Pressable
                  key={doc.reference}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected, disabled }}
                  disabled={disabled}
                  onPress={() => locker.toggle(doc.reference)}
                  style={[styles.document, { borderColor: selected ? theme.colors.primary : theme.colors.border }]}
                >
                  <Stack gap="xs">
                    <AppText variant="label" numberOfLines={1}>{doc.name}</AppText>
                    <AppText variant="caption" color="secondary" numberOfLines={1}>
                      {describeDocument(doc)}
                    </AppText>
                    {doc.reason ? <AppText variant="caption" color="muted">{doc.reason}</AppText> : null}
                    {progress ? (
                      <AppText variant="caption" color={progress.phase === 'Failed' ? 'danger' : 'muted'}>
                        {progress.phase}
                        {progress.duplicate ? ' — already in Documents' : ''}
                        {progress.message ? `: ${progress.message}` : ''}
                      </AppText>
                    ) : null}
                  </Stack>
                </Pressable>
              );
            })}
            <Button
              title={importing ? 'Importing…' : `Import ${selection.length} selected`}
              disabled={locked || !selection.length}
              onPress={confirmImport}
            />
          </>
        )}

        {locker.message ? <AppText variant="caption" color="danger">{locker.message}</AppText> : null}
        <Row gap="sm">
          <Button title="Refresh status" variant="secondary" disabled={busy} onPress={locker.refresh} />
          {session ? (
            <Button
              title={importing ? 'Cancel import' : connected ? 'Disconnect' : 'Cancel'}
              variant="secondary"
              disabled={busy}
              onPress={locker.disconnect}
            />
          ) : null}
        </Row>
      </Stack>
    </Card>
  );
}

const styles = StyleSheet.create({
  grow: { flex: 1, minWidth: 0 },
  document: { padding: 12, borderWidth: 1, borderRadius: 10 },
});
