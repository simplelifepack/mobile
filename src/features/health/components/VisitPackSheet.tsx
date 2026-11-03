import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { Download } from 'lucide-react-native';
import { FileSystem } from 'react-native-file-access';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { healthApi, type HealthMember, type HealthRecord } from '../../../api/health.api';
import { documentsApi } from '../../../api/documents.api';
import type { DocumentRecord } from '../../../api/types';
import { AppText } from '../../../components/primitives/AppText';
import { ListGroup, ListRow, SelectionMark } from '../../../components/primitives/ListRow';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import { radius } from '../../../design/tokens/radius';
import { sizes } from '../../../design/tokens/sizes';
import {
  buildVisitContexts,
  buildVisitPackZip,
  visitDate,
  visitItemLabel,
  visitKindTitles,
  visitSummary,
  type VisitItem,
} from '../visitPack';

export function VisitPackSheet({
  member,
  visible,
  onClose,
}: {
  member?: HealthMember;
  visible: boolean;
  onClose: () => void;
}) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [contextId, setContextId] = useState('');
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!visible || !member) return;
    let active = true;
    setLoading(true);
    setError(undefined);
    setContextId('');
    setExcluded(new Set());
    Promise.all([healthApi.records(member.id), documentsApi.list()])
      .then(([loadedRecords, loadedDocuments]) => {
        if (!active) return;
        setRecords(loadedRecords);
        setDocuments(loadedDocuments);
      })
      .catch(loadError => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Visit details could not be loaded.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [visible, member]);

  const contexts = useMemo(() => buildVisitContexts(records), [records]);
  const context = contexts.find(item => item.id === contextId) ?? contexts[0];

  const items = useMemo<VisitItem[]>(() => {
    if (!context) return [];
    const allowed = new Set(context.recordIds);
    const byId = new Map(documents.map(document => [document.id, document]));
    return records
      .filter(record => allowed.has(record.id))
      .map(record => ({ record, document: byId.get(record.documentId) }));
  }, [context, documents, records]);

  const selected = items.filter(item => !excluded.has(item.record.id));

  const toggle = (recordId: string) =>
    setExcluded(current => {
      const next = new Set(current);
      if (!next.delete(recordId)) next.add(recordId);
      return next;
    });

  const download = async () => {
    if (!member || !context || !selected.length || downloading) return;
    setDownloading(true);
    setError(undefined);
    try {
      const file = await buildVisitPackZip(selected, member.name, context.label);
      if (Platform.OS === 'android') {
        await FileSystem.cpExternal(file.path, file.fileName, 'downloads');
        Alert.alert('Visit pack ready', `Saved to Downloads/${file.fileName}.`);
      } else {
        await Share.share({ title: file.fileName, url: `file://${file.path}` });
      }
      await FileSystem.unlink(file.path).catch(() => undefined);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'The visit pack could not be downloaded.');
    } finally {
      setDownloading(false);
    }
  };

  const chooser = (['doctor', 'provider', 'recent'] as const)
    .map(kind => ({ kind, items: contexts.filter(item => item.kind === kind) }))
    .filter(group => group.items.length);

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close visit preparation"
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.overlay.scrim }]}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface.default,
              borderColor: theme.colors.border.default,
              paddingBottom: Math.max(theme.spacing.md, insets.bottom + 8),
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.border.default }]} />
          <View style={styles.header}>
            <AppText variant="heading">Prepare for a visit</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Done" hitSlop={12} onPress={onClose}>
              <AppText variant="label" style={{ color: theme.colors.text.interactive }}>Done</AppText>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator style={styles.state} color={theme.colors.text.interactive} />
          ) : !contexts.length ? (
            <AppText variant="body" color="secondary" style={styles.state}>
              {error ?? `No visit history for ${member?.name ?? 'this profile'} yet. Add a medical record with a doctor to prepare a visit pack.`}
            </AppText>
          ) : (
            <>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {chooser.map(group => (
                  <View key={group.kind} style={styles.group}>
                    <AppText variant="eyebrow">{visitKindTitles[group.kind]}</AppText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                      {group.items.map(item => {
                        const active = item.id === context?.id;
                        return (
                          <Pressable
                            key={item.id}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            onPress={() => {
                              setContextId(item.id);
                              setExcluded(new Set());
                            }}
                            style={[
                              styles.chip,
                              {
                                borderColor: active ? theme.colors.border.interactive : theme.colors.border.default,
                                backgroundColor: active ? theme.colors.action.primary.default : theme.colors.surface.raised,
                              },
                            ]}
                          >
                            <AppText variant="caption" style={{ color: active ? theme.colors.text.onBrand : theme.colors.text.primary }}>
                              {item.label}
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                ))}

                <AppText variant="bodySm" color="secondary">{visitSummary(items)}</AppText>
                <ListGroup>
                  {items.map(item => {
                    const checked = !excluded.has(item.record.id);
                    const date = visitDate(item);
                    return (
                      <ListRow
                        key={item.record.id}
                        title={visitItemLabel(item)}
                        subtitle={[date === 'Undated' ? undefined : date, item.record.doctor, item.record.provider]
                          .filter(Boolean)
                          .join(' · ') || undefined}
                        trailing={<SelectionMark checked={checked} />}
                        onPress={() => toggle(item.record.id)}
                      />
                    );
                  })}
                </ListGroup>
                {error ? <AppText variant="caption" color="danger">{error}</AppText> : null}
              </ScrollView>

              <Pressable
                accessibilityRole="button"
                disabled={!selected.length || downloading}
                onPress={download}
                style={[
                  styles.action,
                  { backgroundColor: theme.colors.action.primary.default, opacity: !selected.length || downloading ? 0.45 : 1 },
                ]}
              >
                {downloading ? (
                  <ActivityIndicator color={theme.colors.text.onBrand} />
                ) : (
                  <Download size={sizes.icon.md} color={theme.colors.text.onBrand} strokeWidth={2} />
                )}
                <AppText variant="label" style={{ color: theme.colors.text.onBrand }}>
                  {downloading ? 'Preparing visit pack…' : `Download visit pack (${selected.length})`}
                </AppText>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: radius.overlay,
    borderTopRightRadius: radius.overlay,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  handle: { width: sizes.sheetHandle.width, height: sizes.sheetHandle.height, borderRadius: radius.pill, alignSelf: 'center', marginBottom: 12 },
  header: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  state: { paddingVertical: 24 },
  content: { gap: 12, paddingBottom: 12 },
  group: { gap: 8 },
  chips: { gap: 8 },
  chip: { minHeight: sizes.minimumTouchTarget, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderRadius: radius.pill },
  action: { minHeight: 50, borderRadius: radius.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
});
