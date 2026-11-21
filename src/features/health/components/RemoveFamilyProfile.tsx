import React, { useRef, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { ChevronLeft, Download, Info, UserMinus, UserRound } from 'lucide-react-native';
import { FileSystem } from 'react-native-file-access';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { healthApi, type HealthMember } from '../../../api/health.api';
import { documentsApi } from '../../../api/documents.api';
import { AppText } from '../../../components/primitives/AppText';
import { Button } from '../../../components/primitives/Button';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import { radius } from '../../../design/tokens/radius';
import { sizes } from '../../../design/tokens/sizes';
import { buildMemberRecordsZip } from '../visitPack';

export function RemoveFamilyProfile({ member, onClose, onRemove }: {
  member: HealthMember;
  onClose: () => void;
  onRemove: () => Promise<void>;
}) {
  const { theme } = useAppTheme();
  const colors = theme.colors;
  const [busy, setBusy] = useState<'download' | 'delete'>();
  const [error, setError] = useState<string>();
  const active = useRef(false);
  const close = () => { if (!active.current) onClose(); };
  const download = async () => {
    if (active.current) return;
    active.current = true;
    setBusy('download');
    setError(undefined);
    let path: string | undefined;
    try {
      const [records, documents] = await Promise.all([healthApi.records(member.id), documentsApi.list()]);
      if (!records.length) throw new Error('There are no health record documents to download for this profile.');
      const byId = new Map(documents.map(document => [document.id, document]));
      const archive = await buildMemberRecordsZip(records.map(record => ({ record, document: byId.get(record.documentId) })), member.name);
      path = archive.path;
      if (Platform.OS === 'android') {
        await FileSystem.cpExternal(archive.path, archive.fileName, 'downloads');
        Alert.alert('Records saved', `Saved to Downloads/${archive.fileName}.`);
      } else {
        await Share.share({ title: archive.fileName, url: `file://${archive.path}` });
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to download record documents.');
    } finally {
      if (path) await FileSystem.unlink(path).catch(reason => console.warn('Unable to remove record archive cache', reason));
      active.current = false;
      setBusy(undefined);
    }
  };
  const remove = async () => {
    if (active.current) return;
    active.current = true;
    setBusy('delete');
    setError(undefined);
    try {
      await onRemove();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to remove profile. Please try again.');
    } finally {
      active.current = false;
      setBusy(undefined);
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={close}>
      <SafeAreaProvider>
        <SafeAreaView style={[styles.screen, { backgroundColor: colors.surface.canvas }]}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={close} disabled={Boolean(busy)} style={styles.back}>
              <ChevronLeft size={sizes.icon.md} color={colors.icon.primary} />
            </Pressable>
            <AppText variant="overviewTitle">Remove profile</AppText>
          </View>
          <View style={styles.member}>
            <UserRound size={sizes.icon.sm} color={colors.icon.interactive} />
            <AppText variant="caption" style={[styles.memberName, { color: colors.text.interactive }]} numberOfLines={1}>{member.name} · {member.relation}</AppText>
            <AppText variant="caption" color="muted" style={styles.vault}>Private health vault</AppText>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.intro}>
              <View style={[styles.icon, { backgroundColor: colors.surface.brandTint }]}><UserMinus size={sizes.icon.lg} color={colors.icon.interactive} /></View>
              <AppText variant="heading" align="center">Remove {member.name}&apos;s profile?</AppText>
              <AppText variant="bodySm" color="secondary" align="center">This permanently removes the profile and its linked health information.</AppText>
            </View>
            <View style={[styles.card, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
              <View style={styles.detail}>
                <AppText variant="caption" color="muted" style={styles.label}>Profile</AppText>
                <AppText variant="bodySm" style={styles.flex}>{member.name} · {member.relation}</AppText>
              </View>
              <View style={styles.detail}>
                <AppText variant="caption" color="muted" style={styles.label}>Will be removed</AppText>
                <AppText variant="bodySm" style={styles.flex}>Profile, readings, tracked tests, medicines, follow-ups, reminders and the documents linked to its health records</AppText>
              </View>
            </View>
            <View style={[styles.notice, { backgroundColor: colors.status.warning.surface }]}>
              <Info size={sizes.icon.sm} color={colors.status.warning.text} />
              <AppText variant="caption" style={[styles.flex, { color: colors.status.warning.text }]}>This cannot be undone. The record documents are also deleted from Documents. Download them first if you need a copy; the ZIP contains documents only, not readings or other profile data.</AppText>
            </View>
            {error ? <AppText variant="caption" color="danger" accessibilityRole="alert">{error}</AppText> : null}
            <View style={styles.buttons}>
              <Pressable accessibilityRole="button" accessibilityLabel="Download record documents" disabled={Boolean(busy)} onPress={() => { download(); }}
                style={[styles.action, { borderColor: colors.border.interactive }, busy && styles.busy]}>
                <AppText variant="action" style={{ color: colors.text.interactive }}>{busy === 'download' ? 'Preparing ZIP…' : 'Download record documents'}</AppText>
                <Download size={sizes.icon.sm} color={colors.icon.interactive} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Delete profile" disabled={Boolean(busy)} onPress={() => { remove(); }}
                style={[styles.action, { borderColor: colors.border.destructive.default, backgroundColor: colors.status.danger.surface }, busy && styles.busy]}>
                <AppText variant="action" style={{ color: colors.text.destructive }}>{busy === 'delete' ? 'Deleting…' : 'Delete profile'}</AppText>
              </Pressable>
              <Button title="Cancel" variant="secondary" disabled={Boolean(busy)} onPress={close} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, minHeight: 48 },
  back: { width: sizes.minimumTouchTarget, height: sizes.minimumTouchTarget, alignItems: 'center', justifyContent: 'center' },
  member: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, minHeight: 40 },
  memberName: { flexShrink: 1 },
  vault: { flex: 1, textAlign: 'right' },
  content: { padding: 16, gap: 16, paddingBottom: 24 },
  intro: { alignItems: 'center', gap: 16, paddingVertical: 24 },
  icon: { width: 64, height: 64, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: 1, borderRadius: radius.surface, padding: 16, gap: 12 },
  detail: { flexDirection: 'row', gap: 12 },
  label: { width: 116 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: radius.control, gap: 8, padding: 12 },
  buttons: { gap: 8 },
  action: { minHeight: sizes.minimumTouchTarget, borderWidth: 1, borderRadius: radius.control, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  busy: { opacity: 0.5 },
});
