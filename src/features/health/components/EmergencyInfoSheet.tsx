import React, { useMemo, useState } from 'react';
import { Alert, Linking, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { FileSystem } from 'react-native-file-access';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../../components/primitives/Button';
import { Row } from '../../../components/primitives/Row';
import { AppText } from '../../../components/primitives/AppText';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import { radius } from '../../../design/tokens/radius';
import { sizes } from '../../../design/tokens/sizes';
import type { HealthMember, HealthRecord } from '../../../api/health.api';
import type { DocumentRecord } from '../../../api/types';
import { buildEmergencyCardRows } from './emergencyCard';
import { writeEmergencyCardPdf } from './emergencyCardPdf';

export function EmergencyInfoSheet({
  member,
  records,
  documents,
  visible,
  onClose,
}: {
  member?: HealthMember;
  records: HealthRecord[];
  documents: DocumentRecord[];
  visible: boolean;
  onClose: () => void;
}) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const rows = useMemo(
    () => (member ? buildEmergencyCardRows(member, records, documents) : []),
    [member, records, documents],
  );
  const phone = member?.emergencyContactPhone;
  const [busy, setBusy] = useState<'save' | 'export'>();

  const runPdf = async (mode: 'save' | 'export') => {
    if (!member || busy) return;
    setBusy(mode);
    try {
      const file = await writeEmergencyCardPdf(rows, member.name);
      if (mode === 'save' && Platform.OS === 'android') {
        await FileSystem.cpExternal(file.path, file.fileName, 'downloads');
        Alert.alert('Saved', `Saved to Downloads/${file.fileName}.`);
      } else {
        await Share.share({ title: file.fileName, url: `file://${file.path}` });
      }
      await FileSystem.unlink(file.path).catch(() => undefined);
    } catch (error) {
      Alert.alert('PDF failed', error instanceof Error ? error.message : 'The emergency card could not be created.');
    } finally {
      setBusy(undefined);
    }
  };

  const generated = new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close emergency card"
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.overlay.scrim }]}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface.canvas,
              borderColor: theme.colors.border.default,
              paddingBottom: Math.max(theme.spacing.md, insets.bottom + 8),
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.border.default }]} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <AppText variant="caption" color="secondary">One tap · assembled from your archive</AppText>
              <AppText variant="listTitle">Emergency card</AppText>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Done" hitSlop={12} onPress={onClose}>
              <AppText variant="label" style={{ color: theme.colors.text.interactive }}>Done</AppText>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View
              style={[
                styles.paper,
                { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default },
              ]}
            >
              <View style={[styles.band, { backgroundColor: theme.colors.status.danger.surface }]}>
                <AppText variant="label" style={[styles.bandTitle, { color: theme.colors.status.danger.text }]}>
                  Emergency info
                </AppText>
                <AppText variant="label" style={{ color: theme.colors.status.danger.text }}>Readines</AppText>
              </View>

              {rows.map((row, index) => {
                const isPhoneRow = row.label === 'Emergency contact' && !!phone;
                return (
                  <Pressable
                    key={row.label}
                    disabled={!isPhoneRow}
                    accessibilityRole={isPhoneRow ? 'button' : undefined}
                    accessibilityLabel={isPhoneRow ? `Call ${phone}` : undefined}
                    onPress={() => { Linking.openURL(`tel:${phone}`); }}
                    style={[
                      styles.row,
                      index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.border.subtle },
                    ]}
                  >
                    <AppText variant="bodySm" color="secondary" style={styles.label}>{row.label}</AppText>
                    <AppText
                      variant="labelMd"
                      style={[styles.value, isPhoneRow && { color: theme.colors.text.interactive }]}
                    >
                      {row.value}
                    </AppText>
                  </Pressable>
                );
              })}

              <View style={[styles.footer, { borderTopColor: theme.colors.border.default }]}>
                <AppText variant="caption" color="secondary">Assembled facts only · no diagnosis.</AppText>
                <AppText variant="caption" color="secondary">Generated {generated}</AppText>
              </View>
            </View>
          </ScrollView>
          <Row gap="sm" style={styles.actions}>
            <View style={styles.action}>
              <Button title={busy === 'save' ? 'Saving…' : 'Save as PDF'} variant="secondary" disabled={!!busy} onPress={() => runPdf('save')} />
            </View>
            <View style={styles.action}>
              <Button title={busy === 'export' ? 'Exporting…' : 'Export'} disabled={!!busy} onPress={() => runPdf('export')} />
            </View>
          </Row>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: radius.overlay,
    borderTopRightRadius: radius.overlay,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  handle: { width: sizes.sheetHandle.width, height: sizes.sheetHandle.height, borderRadius: radius.pill, alignSelf: 'center', marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerCopy: { flex: 1 },
  paper: { borderWidth: 1, borderRadius: radius.surface, overflow: 'hidden' },
  band: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12 },
  bandTitle: { textTransform: 'uppercase', letterSpacing: 1 },
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 12, paddingVertical: 8 },
  label: { width: 112 },
  value: { flex: 1 },
  actions: { marginTop: 8 },
  action: { flex: 1 },
  footer: { borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
});
