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
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { healthApi, isMemberResolution, type HealthMember } from '../../api/health.api';
import { documentsApi } from '../../api/documents.api';
import { packagesApi } from '../../api/packages.api';
import type { DocumentRecord, PackageSummary } from '../../api/types';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { SectionHeader } from '../../components/primitives/SectionHeader';
import { DatePickerInput } from '../../components/primitives/DatePickerInput';
import { ActionSheet } from '../../components/primitives/ActionSheet';
import { Dropdown } from '../../components/primitives/Dropdown';
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
type Busy = 'assign' | 'expiry' | 'notes' | 'delete' | 'health' | null;

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
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [healthMembers, setHealthMembers] = useState<HealthMember[]>();
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

  const isMedical = category === 'Health' || document.category === 'Medical';
  const healthType = /lab/i.test(document.documentType)
    ? 'lab_report'
    : /prescription/i.test(document.documentType)
      ? 'prescription'
      : 'medical_report';

  const addToHealth = async (memberId?: string) => {
    setBusy('health');
    setError(undefined);
    try {
      const result = await healthApi.createRecord({ memberId, documentId: document.id, type: healthType });
      if (isMemberResolution(result)) {
        setHealthMembers(await healthApi.members());
        return;
      }
      setHealthMembers(undefined);
      Alert.alert('Added to Health', 'This document now appears in your Health records.');
    } catch (healthError) {
      setError(healthError instanceof Error ? healthError.message : 'Unable to add to Health.');
    } finally {
      setBusy(null);
    }
  };

  const saving = busy === 'notes' || busy === 'expiry' || busy === 'assign';

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
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface.canvas }]}>
          <View style={[styles.handle, { backgroundColor: theme.colors.border.default }]} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={12}
            onPress={onClose}
            style={[styles.close, { backgroundColor: theme.colors.surface.secondary }]}
          >
            <X size={theme.sizes.icon.sm} color={theme.colors.icon.secondary} />
          </Pressable>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.hero}>
              <View style={styles.heroRow}>
                <View style={[styles.iconTile, { backgroundColor: theme.colors.surface.brandTint }]}>
                  <Icon size={theme.sizes.icon.lg} color={theme.colors.icon.interactive} />
                </View>
                <View style={styles.heroCopy}>
                  <AppText variant="heading" numberOfLines={2}>{title}</AppText>
                  <AppText variant="bodySm" color="secondary" numberOfLines={1}>
                    {document.originalName}
                  </AppText>
                </View>
              </View>
              {banner && bannerStatus ? (
                <View style={[styles.banner, { borderColor: bannerStatus.border, backgroundColor: bannerStatus.surface }]}>
                  <CalendarClock size={theme.sizes.icon.sm} color={bannerStatus.icon} />
                  <AppText variant="labelMd" style={{ color: bannerStatus.text }}>{banner.text}</AppText>
                </View>
              ) : null}
            </View>

            <View style={styles.section}>
              <SectionHeader title="Details" />
              <ListGroup>
                {details
                  .filter((row): row is [string, string] => Boolean(row[1]))
                  .map(([label, value]) => (
                    <ListRow key={label} title={label} trailing={<AppText color="secondary">{value}</AppText>} />
                  ))}
              </ListGroup>
            </View>

            <View style={styles.section}>
              <SectionHeader title="Belongs to" />
              <Dropdown
                label="Belongs to"
                value={people.find(person => person.id === personId)?.name ?? 'Select a person'}
                onPress={() => people.length && setPeopleOpen(true)}
              />
              <ActionSheet
                visible={peopleOpen}
                title="Belongs to"
                onClose={() => setPeopleOpen(false)}
                options={people.map(person => ({
                  label: person.name,
                  selected: person.id === personId,
                  onPress: () => {
                    setPeopleOpen(false);
                    if (person.id !== personId) run('assign', () => documentsApi.bulkAssign([document.id], person.id));
                  },
                }))}
              />
            </View>

            <View style={styles.section}>
              <SectionHeader
                title="Expiry"
                actionLabel={expiry ? 'Clear' : undefined}
                onAction={() => run('expiry', () => documentsApi.updateDetails(document.id, { expiry: null }))}
              />
              <DatePickerInput
                value={expiry}
                placeholder="Add an expiry date"
                onChangeText={value => run('expiry', () => documentsApi.updateDetails(document.id, { expiry: value }))}
              />
            </View>

            <View style={styles.section}>
              <SectionHeader title="Used in packages" />
              {packages === undefined ? (
                <ActivityIndicator color={theme.colors.action.primary.default} />
              ) : used.length ? (
                <ListGroup>
                  {used.map(({ pack, required }) => (
                    <ListRow
                      key={pack.id}
                      icon={<FolderOpen size={theme.sizes.icon.md} color={theme.colors.icon.interactive} />}
                      title={pack.title}
                      subtitle={required ? 'Required' : 'Optional'}
                    />
                  ))}
                </ListGroup>
              ) : (
                <AppText color="secondary">Not used in any package yet.</AppText>
              )}
            </View>

            <View style={styles.section}>
              <SectionHeader title="Notes" />
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
                {saving ? 'Saving…' : 'Saved automatically'}
              </AppText>
            </View>
            {error ? <AppText color="danger">{error}</AppText> : null}
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                backgroundColor: theme.colors.surface.default,
                borderColor: theme.colors.border.subtle,
                paddingBottom: Math.max(16, insets.bottom + 8),
              },
            ]}
          >
            <Button title="Preview document" onPress={onPreview} />
            {isMedical ? (
              <Button
                title={busy === 'health' ? 'Adding to Health…' : 'Add to Health'}
                variant="secondary"
                disabled={busy === 'health'}
                onPress={() => addToHealth()}
              />
            ) : null}
            <Button
              title="Delete document"
              variant="danger"
              disabled={busy === 'delete'}
              onPress={confirmDelete}
            />
          </View>
        </View>
        <ActionSheet
          visible={Boolean(healthMembers)}
          title="Add to which profile?"
          onClose={() => setHealthMembers(undefined)}
          options={(healthMembers ?? []).map(member => ({
            label: member.name,
            onPress: () => addToHealth(member.id),
          }))}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    height: '90%',
    borderTopLeftRadius: radius.overlay,
    borderTopRightRadius: radius.overlay,
    overflow: 'hidden',
    paddingTop: 8,
  },
  handle: {
    width: sizes.sheetHandle.width,
    height: sizes.sheetHandle.height,
    borderRadius: radius.pill,
    alignSelf: 'center',
  },
  close: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 24 },
  hero: { alignItems: 'flex-start', gap: 12 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 40 },
  heroCopy: { flex: 1, gap: 2 },
  iconTile: { width: 56, height: 56, borderRadius: radius.surface, alignItems: 'center', justifyContent: 'center' },
  section: { gap: 8 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  notes: { minHeight: 96, borderWidth: 1, borderRadius: radius.surface, padding: 12 },
  footer: { gap: 8, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
});
