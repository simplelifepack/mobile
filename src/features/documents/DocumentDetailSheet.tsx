import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  CalendarClock,
  FolderOpen,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { documentsApi } from '../../api/documents.api';
import { packagesApi } from '../../api/packages.api';
import type { DocumentRecord, PackageSummary } from '../../api/types';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { DatePickerInput } from '../../components/primitives/DatePickerInput';
import { ListGroup, ListRow } from '../../components/primitives/ListRow';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import { formatDate } from '../../utils/format';
import {
  assignedPersonId,
  daysUntil,
  documentExpiry,
  documentNotes,
  documentSizeLabel,
  documentSourceLabel,
  packagesUsingDocument,
  type PackageUse,
} from './documentDetails';

type Person = { id: string; name: string };
type Busy = 'assign' | 'expiry' | 'notes' | 'delete' | null;

const NOTES_LIMIT = 5000;
const EXPIRING_SOON_DAYS = 60;

function expiryBanner(expiry: string) {
  const days = daysUntil(expiry);
  if (days < 0) {
    const ago = Math.abs(days);
    return { tone: 'danger' as const, text: `Expired ${ago} day${ago === 1 ? '' : 's'} ago` };
  }
  return {
    tone: days < EXPIRING_SOON_DAYS ? ('warning' as const) : ('success' as const),
    text: days === 0 ? 'Expires today' : `Valid · expires in ${days} day${days === 1 ? '' : 's'}`,
  };
}

export function DocumentDetailSheet({
  document,
  title,
  category,
  icon: Icon,
  onClose,
  onPreview,
  onChanged,
}: {
  document?: DocumentRecord;
  title: string;
  category: string;
  icon: LucideIcon;
  onClose: () => void;
  onPreview: () => void;
  onChanged: () => Promise<unknown> | void;
}) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [people, setPeople] = useState<Person[]>([]);
  const [packages, setPackages] = useState<PackageSummary[]>();
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string>();
  const documentId = document?.id;

  useEffect(() => {
    if (!documentId) return;
    let cancelled = false;
    setNotes(document ? documentNotes(document) : '');
    setError(undefined);
    setPackages(undefined);
    documentsApi
      .assignmentOptions()
      .then(value => !cancelled && setPeople(value))
      .catch(() => undefined);
    (async () => {
      const items: PackageSummary[] = [];
      for (let page = 1; !cancelled; page += 1) {
        const response = await packagesApi.list({ page, limit: 100 });
        items.push(...response.items);
        if (!response.pagination.hasNextPage) break;
      }
      if (!cancelled) setPackages(items);
    })().catch(() => !cancelled && setPackages([]));
    return () => {
      cancelled = true;
    };
    // Reset only when a different document is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const run = async (kind: Exclude<Busy, null>, action: () => Promise<unknown>) => {
    setBusy(kind);
    setError(undefined);
    try {
      await action();
      await onChanged();
    } catch {
      setError(kind === 'delete' ? 'Unable to delete this document.' : 'Unable to save changes. Please try again.');
      return false;
    } finally {
      setBusy(null);
    }
    return true;
  };

  if (!document) return null;

  const expiry = documentExpiry(document);
  const banner = expiry ? expiryBanner(expiry) : undefined;
  const bannerStatus = banner ? theme.colors.status[banner.tone] : undefined;
  const personId = assignedPersonId(document);
  const used: PackageUse[] = packages ? packagesUsingDocument(document, packages) : [];
  const savedNotes = documentNotes(document);

  const confirmDelete = () =>
    Alert.alert('Delete this document?', 'This permanently removes it from your vault.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (await run('delete', () => documentsApi.delete(document.id))) onClose();
        },
      },
    ]);

  const details: Array<[string, string | undefined]> = [
    ['Category', category],
    ['Source', documentSourceLabel(document)],
    ['Added', formatDate(document.createdAt)],
    ['Size', documentSizeLabel(document)],
  ];

  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close document details"
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.overlay.scrim }]}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.border.default }]} />
          <View style={styles.header}>
            <View style={[styles.iconTile, { backgroundColor: theme.colors.surface.brandTint }]}>
              <Icon size={theme.sizes.icon.md} color={theme.colors.action.primary.default} />
            </View>
            <View style={styles.flex}>
              <AppText variant="heading" numberOfLines={2}>{title}</AppText>
              <AppText variant="caption" color="secondary" numberOfLines={1}>
                {document.originalName}
              </AppText>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} onPress={onClose}>
              <X size={theme.sizes.icon.md} color={theme.colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {banner && bannerStatus ? (
              <View style={[styles.banner, { borderColor: bannerStatus.border, backgroundColor: bannerStatus.surface }]}>
                <CalendarClock size={theme.sizes.icon.sm} color={bannerStatus.icon} />
                <AppText variant="labelMd" style={{ color: bannerStatus.text }}>{banner.text}</AppText>
              </View>
            ) : null}

            <View style={styles.section}>
              <AppText variant="eyebrow">Details</AppText>
              <ListGroup>
                {details
                  .filter((row): row is [string, string] => Boolean(row[1]))
                  .map(([label, value]) => (
                    <ListRow key={label} title={label} trailing={<AppText color="secondary">{value}</AppText>} />
                  ))}
              </ListGroup>
            </View>

            <View style={styles.section}>
              <AppText variant="eyebrow">Belongs to</AppText>
              <View style={styles.chips}>
                {people.map(person => {
                  const selected = person.id === personId;
                  return (
                    <Pressable
                      key={person.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      disabled={busy !== null}
                      onPress={() => !selected && run('assign', () => documentsApi.bulkAssign([document.id], person.id))}
                      style={[
                        styles.chip,
                        {
                          borderColor: selected ? theme.colors.action.primary.default : theme.colors.border.default,
                          backgroundColor: selected ? theme.colors.surface.brandTint : theme.colors.surface.default,
                        },
                      ]}
                    >
                      <AppText variant="labelMd" color={selected ? 'heading' : 'secondary'}>{person.name}</AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <AppText variant="eyebrow">Expiry</AppText>
              <DatePickerInput
                value={expiry}
                placeholder="Add an expiry date"
                onChangeText={value => run('expiry', () => documentsApi.updateDetails(document.id, { expiry: value }))}
              />
              {expiry ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => run('expiry', () => documentsApi.updateDetails(document.id, { expiry: null }))}
                >
                  <AppText variant="bodySm" color="secondary">Clear expiry date</AppText>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.section}>
              <AppText variant="eyebrow">Used in packages</AppText>
              {packages === undefined ? (
                <ActivityIndicator color={theme.colors.action.primary.default} />
              ) : used.length ? (
                <ListGroup>
                  {used.map(({ pack, required }) => (
                    <ListRow
                      key={pack.id}
                      title={pack.title}
                      subtitle={required ? 'Required' : 'Optional'}
                      leading={<FolderOpen size={theme.sizes.icon.sm} color={theme.colors.text.secondary} />}
                    />
                  ))}
                </ListGroup>
              ) : (
                <AppText color="secondary">Not used in any package yet.</AppText>
              )}
            </View>

            <View style={styles.section}>
              <AppText variant="eyebrow">Notes</AppText>
              <TextInput
                multiline
                value={notes}
                maxLength={NOTES_LIMIT}
                onChangeText={setNotes}
                onBlur={() => notes !== savedNotes && run('notes', () => documentsApi.updateDetails(document.id, { notes }))}
                placeholder="Add a note for yourself"
                placeholderTextColor={theme.colors.text.tertiary}
                textAlignVertical="top"
                style={[
                  styles.notes,
                  {
                    color: theme.colors.text.primary,
                    borderColor: theme.colors.border.default,
                    backgroundColor: theme.colors.surface.default,
                    ...theme.typography.body,
                  },
                ]}
              />
              <AppText variant="caption" color="muted">
                {busy === 'notes' || busy === 'expiry' || busy === 'assign' ? 'Saving…' : 'Saved automatically'}
              </AppText>
            </View>
            {error ? <AppText color="danger">{error}</AppText> : null}
          </ScrollView>

          <View
            style={[
              styles.footer,
              { borderColor: theme.colors.border.default, paddingBottom: Math.max(16, insets.bottom + 8) },
            ]}
          >
            <View style={styles.flex}>
              <Button title="Preview" onPress={onPreview} />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete document"
              disabled={busy === 'delete'}
              onPress={confirmDelete}
              style={[styles.delete, { borderColor: theme.colors.border.destructive.default }]}
            >
              <Trash2 size={theme.sizes.icon.md} color={theme.colors.status.danger.icon} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    height: '88%',
    borderTopLeftRadius: radius.overlay,
    borderTopRightRadius: radius.overlay,
    borderWidth: 1,
    paddingTop: 8,
  },
  handle: {
    width: sizes.sheetHandle.width,
    height: sizes.sheetHandle.height,
    borderRadius: radius.pill,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  iconTile: { width: 44, height: 44, borderRadius: radius.surface, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 24, gap: 20 },
  section: { gap: 8 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.surface,
    padding: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1, borderRadius: radius.pill },
  notes: { minHeight: 96, borderWidth: 1, borderRadius: radius.surface, padding: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  delete: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderRadius: radius.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
