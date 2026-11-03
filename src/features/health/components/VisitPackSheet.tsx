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
  TextInput,
  View,
} from 'react-native';
import {
  CalendarClock,
  Check,
  ChevronLeft,
  Download,
  FileText,
} from 'lucide-react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { FileSystem } from 'react-native-file-access';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  healthApi,
  type HealthMember,
  type HealthRecord,
} from '../../../api/health.api';
import { documentsApi } from '../../../api/documents.api';
import type { DocumentRecord } from '../../../api/types';
import { AppText } from '../../../components/primitives/AppText';
import { Row } from '../../../components/primitives/Row';
import {
  ListGroup,
  ListRow,
  SelectionMark,
} from '../../../components/primitives/ListRow';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import { radius } from '../../../design/tokens/radius';
import { sizes } from '../../../design/tokens/sizes';
import {
  buildVisitContexts,
  buildVisitPackZip,
  formatVisitDate,
  visitAppointmentDate,
  visitChooserGroups,
  visitItemDetail,
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
  const [choosing, setChoosing] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible || !member) return;
    let active = true;
    setLoading(true);
    setError(undefined);
    setContextId('');
    setExcluded(new Set());
    setChoosing(false);
    setQuery('');
    Promise.all([healthApi.records(member.id), documentsApi.list()])
      .then(([loadedRecords, loadedDocuments]) => {
        if (!active) return;
        setRecords(loadedRecords);
        setDocuments(loadedDocuments);
      })
      .catch(loadError => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Visit details could not be loaded.',
          );
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
      const file = await buildVisitPackZip(
        selected,
        member.name,
        context.label,
      );
      if (Platform.OS === 'android') {
        await FileSystem.cpExternal(file.path, file.fileName, 'downloads');
        Alert.alert('Visit pack ready', `Saved to Downloads/${file.fileName}.`);
      } else {
        await Share.share({ title: file.fileName, url: `file://${file.path}` });
      }
      await FileSystem.unlink(file.path).catch(() => undefined);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : 'The visit pack could not be downloaded.',
      );
    } finally {
      setDownloading(false);
    }
  };

  const viewDocument = async (item: VisitItem) => {
    try {
      const mimeType = item.document?.mimeType ?? 'application/pdf';
      const file = await documentsApi.preview(item.record.documentId, mimeType);
      if (Platform.OS === 'ios')
        await ReactNativeBlobUtil.ios.openDocument(file.path);
      else
        await ReactNativeBlobUtil.android.actionViewIntent(file.path, mimeType);
    } catch (viewError) {
      Alert.alert(
        'Unable to open document',
        viewError instanceof Error ? viewError.message : 'Please try again.',
      );
    }
  };

  const chooserGroups = useMemo(
    () => visitChooserGroups(contexts, context?.id ?? '', query),
    [contexts, context?.id, query],
  );
  const appointmentDate = visitAppointmentDate(items);

  const renderChooser = () => (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <Row align="center" gap="sm">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={() => setChoosing(false)}
        >
          <ChevronLeft
            size={sizes.icon.md}
            color={theme.colors.text.primary}
            strokeWidth={2}
          />
        </Pressable>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search doctors, specialisations, hospitals"
          accessibilityLabel="Search doctors, specialisations, hospitals"
          autoCorrect={false}
          style={styles.search}
        />
      </Row>
      {chooserGroups.map(group => (
        <View key={group.kind} style={styles.group}>
          <AppText variant="eyebrow">{visitKindTitles[group.kind]}</AppText>
          <ListGroup>
            {group.items.map(item => (
              <ListRow
                key={item.id}
                title={item.label}
                subtitle={`${item.recordIds.length} ${item.recordIds.length === 1 ? 'doc' : 'docs'}`}
                trailing={
                  item.id === context?.id ? (
                    <Check
                      size={sizes.icon.md}
                      color={theme.colors.text.interactive}
                      strokeWidth={2.4}
                    />
                  ) : undefined
                }
                onPress={() => {
                  setContextId(item.id);
                  setExcluded(new Set());
                  setChoosing(false);
                }}
              />
            ))}
          </ListGroup>
        </View>
      ))}
    </ScrollView>
  );

  const renderPack = () => (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <AppText variant="label">
          Next appointment: {context?.label}
          {appointmentDate ? ` on ${formatVisitDate(appointmentDate)}` : ''}.
        </AppText>
        <View
          style={[
            styles.contextCard,
            {
              backgroundColor: theme.colors.surface.raised,
              borderColor: theme.colors.border.default,
            },
          ]}
        >
          <View style={styles.flex}>
            <AppText variant="caption" color="secondary">
              {context ? visitKindTitles[context.kind] : ''}
            </AppText>
            <AppText variant="listTitle">{context?.label}</AppText>
            <AppText variant="bodySm" color="secondary">
              {items.length} {items.length === 1 ? 'document' : 'documents'} ·
              tap to choose another doctor, hospital, or specialisation
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setChoosing(true)}
          >
            <AppText
              variant="label"
              style={{ color: theme.colors.text.interactive }}
            >
              Change
            </AppText>
          </Pressable>
        </View>
        <AppText
          variant="bodySm"
          color={items.length ? 'primary' : 'secondary'}
        >
          {items.length
            ? visitSummary(items)
            : 'No documents are available for this selection.'}
        </AppText>
        <ListGroup>
          {items.map(item => {
            const checked = !excluded.has(item.record.id);
            return (
              <ListRow
                key={item.record.id}
                title={visitItemLabel(item)}
                subtitle={visitItemDetail(item)}
                leading={
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityLabel={`Select ${visitItemLabel(item)}`}
                    accessibilityState={{ checked }}
                    hitSlop={8}
                    onPress={() => toggle(item.record.id)}
                  >
                    <SelectionMark checked={checked} />
                  </Pressable>
                }
                trailing={
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => viewDocument(item)}
                  >
                    <AppText
                      variant="label"
                      style={{ color: theme.colors.text.interactive }}
                    >
                      View
                    </AppText>
                  </Pressable>
                }
                onPress={() => toggle(item.record.id)}
              />
            );
          })}
        </ListGroup>
        <View
          style={[
            styles.note,
            {
              backgroundColor: theme.colors.surface.raised,
              borderColor: theme.colors.border.default,
            },
          ]}
        >
          <FileText
            size={sizes.icon.md}
            color={theme.colors.text.secondary}
            strokeWidth={2}
          />
          <AppText variant="bodySm" style={styles.flex}>
            Cover sheet included: allergies, conditions, medicines, and latest
            readings.
          </AppText>
          <AppText variant="label" color="muted">
            Preview
          </AppText>
        </View>
        {error ? (
          <AppText variant="caption" color="danger">
            {error}
          </AppText>
        ) : null}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        disabled={!selected.length || downloading}
        onPress={download}
        style={[
          styles.action,
          {
            backgroundColor: theme.colors.action.primary.default,
            opacity: !selected.length || downloading ? 0.45 : 1,
          },
        ]}
      >
        {downloading ? (
          <ActivityIndicator color={theme.colors.text.onBrand} />
        ) : (
          <Download
            size={sizes.icon.md}
            color={theme.colors.text.onBrand}
            strokeWidth={2}
          />
        )}
        <AppText variant="label" style={{ color: theme.colors.text.onBrand }}>
          {downloading
            ? 'Preparing visit pack…'
            : `Download visit pack (cover + ${selected.length})`}
        </AppText>
      </Pressable>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close visit preparation"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.colors.overlay.scrim },
          ]}
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
          <View
            style={[
              styles.handle,
              { backgroundColor: theme.colors.border.default },
            ]}
          />
          <View style={styles.header}>
            <View style={styles.flex}>
              <AppText variant="caption" color="secondary">
                Your own records, filtered for this visit
              </AppText>
              <AppText variant="heading">Prepare for a visit</AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Done"
              hitSlop={12}
              onPress={onClose}
            >
              <AppText
                variant="label"
                style={{ color: theme.colors.text.interactive }}
              >
                Done
              </AppText>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator
              style={styles.state}
              color={theme.colors.text.interactive}
            />
          ) : !contexts.length ? (
            <View style={styles.empty}>
              <CalendarClock
                size={sizes.icon.lg}
                color={theme.colors.text.secondary}
                strokeWidth={2}
              />
              <AppText variant="listTitle">
                No visit history for {member?.name ?? 'this profile'} yet.
              </AppText>
              <AppText variant="body" color="secondary" align="center">
                {error ??
                  'Add a medical record with a doctor or documented follow-up to prepare a visit pack.'}
              </AppText>
            </View>
          ) : choosing ? (
            renderChooser()
          ) : (
            renderPack()
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
  handle: {
    width: sizes.sheetHandle.width,
    height: sizes.sheetHandle.height,
    borderRadius: radius.pill,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  state: { paddingVertical: 24 },
  content: { gap: 12, paddingBottom: 12 },
  group: { gap: 8 },
  flex: { flex: 1 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  search: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.surface,
    paddingHorizontal: 12,
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: radius.surface,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: radius.surface,
  },
  action: {
    minHeight: 50,
    borderRadius: radius.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
});
