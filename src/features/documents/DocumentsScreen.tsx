import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ProfileAvatarButton } from '../../components/navigation/ProfileAvatarButton';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { ApiError } from '../../api/client';
import styled from 'styled-components/native';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  Check,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  FileText,
  Fingerprint,
  HeartPulse,
  House,
  Image as ImageIcon,
  Landmark,
  Plane,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from 'lucide-react-native';

import Pdf from 'react-native-pdf';
import { FileSystem } from 'react-native-file-access';
import type {
  DocumentAnalysisResponse,
  DocumentRecord,
  DocumentSavePayload,
} from '../../api/types';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DocumentDetailSheet } from './DocumentDetailSheet';
import { DocumentFilterSheet } from './DocumentFilterSheet';
import {
  ALL,
  activeFilterCount,
  applyDocumentFilters,
  defaultFilters,
  documentCategory,
  documentPersonName,
  matchesQuickFilter,
  quickFilterLabels,
  type DocumentFilters,
} from './documentFilters';
import { useDocumentsQuery } from '../../services/api';
import { documentsApi } from '../../api/documents.api';
import { healthApi, isMemberResolution, type HealthMember, type HealthRecordDetail } from '../../api/health.api';
import { documentContextLabel, healthRecordType, isHealthDocument } from './documentDetails';
import {
  analyzeSelectedDocument,
  captureDocumentPhoto,
  startConsentedImport,
  selectDocumentFile,
  selectImageFromGallery,
  type SelectedDocument,
} from './documentImport';
import { ActionSheet } from '../../components/primitives/ActionSheet';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { FloatingActionButton } from '../../components/primitives/FloatingActionButton';
import { Card } from '../../components/primitives/Card';
import { Row } from '../../components/primitives/Row';
import { sizes } from '../../design/tokens/sizes';
import { ListGroup, ListRow, SelectionMark } from '../../components/primitives/ListRow';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { SkeletonList } from '../../components/feedback/SkeletonList';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { fontSize, lineHeight } from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';

const PreviewModalSurface = styled.View(({ theme }) => ({
  flex: 1,
  paddingTop: 12,
  paddingHorizontal: 12,
  paddingBottom: 12,
  backgroundColor: theme.colors.surface.canvas,
}));
const PreviewSafeArea = styled(SafeAreaView)(() => ({
  flex: 1,
}));

function categoryFor(type: string) {
  const value = type.toLowerCase();

  if (
    /(passport|visa|license|identity|aadhaar|aadhar|pan|birth|citizenship)/.test(
      value,
    )
  ) {
    return 'Identity';
  }

  if (
    /(health|medical|insurance|prescription|hospital|vaccination)/.test(
      value,
    )
  ) {
    return 'Health';
  }

  if (
    /(bank|tax|income|loan|investment|nps|mutual|salary|payslip|itr)/.test(
      value,
    )
  ) {
    return 'Finance';
  }

  if (
    /(property|home|lease|utility|rent|mortgage)/.test(value)
  ) {
    return 'Home';
  }

  if (
    /(travel|flight|hotel|passport|visa)/.test(value)
  ) {
    return 'Travel';
  }

  return 'Other';
}

function getDocumentTitle(document: {
  displayName?: string | null;
  title?: string | null;
  originalName: string;
}) {
  return (
    document.displayName ??
    document.title ??
    document.originalName
  );
}

function getDocumentIcon(type: string) {
  const category = categoryFor(type);

  switch (category) {
    case 'Identity':
      return Fingerprint;

    case 'Health':
      return HeartPulse;

    case 'Finance':
      return Landmark;

    case 'Home':
      return House;

    case 'Travel':
      return Plane;

    default:
      return FileText;
  }
}

export function DocumentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useAppTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const previewRequestId = useRef(0);

  const {
    data,
    error,
    isLoading,
    refetch,
  } = useDocumentsQuery();

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<DocumentFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [picker, setPicker] = useState<'category' | 'person'>();
  const [selectionMode, setSelectionMode] =
    useState(false);
  const [selectedIds, setSelectedIds] = useState<
    string[]
  >([]);
  const [detailId, setDetailId] =
    useState<string>();
  const [previewDocument, setPreviewDocument] =
    useState<DocumentRecord>();
  const [previewPath, setPreviewPath] = useState<string>();
  const [previewMimeType, setPreviewMimeType] = useState('');
  const [previewPageIndex, setPreviewPageIndex] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showAddDocumentsSheet, setShowAddDocumentsSheet] = useState(false);
  const [healthPrompt, setHealthPrompt] = useState<{
    document: DocumentRecord;
    name: string;
    members: HealthMember[];
  }>();
  const [isImporting, setIsImporting] = useState(false);
  const [previewError, setPreviewError] = useState<string>();
  const previewPages = previewDocument?.pages ?? [];

  useEffect(() => {
    if (!previewPath) return;
    const path = previewPath;
    return () => {
      FileSystem.unlink(path).catch(() => undefined);
    };
  }, [previewPath]);

  const toggleSearch = () => {
    if (searchOpen) setQuery('');
    setSearchOpen(open => !open);
  };

  const openPreview = async (
    document: DocumentRecord,
    pageIndex = 0,
  ) => {
    if (document.source === 'GOOGLE_DRIVE' && document.openUrl) {
      try {
        await Linking.openURL(document.openUrl);
      } catch (openError) {
        Alert.alert(
          'Unable to open Google Drive file',
          openError instanceof Error ? openError.message : 'Please try again.',
        );
      }
      return;
    }

    const page = document.pages?.[pageIndex];
    const mimeType = page?.mimeType ?? document.mimeType ?? '';
    const requestId = ++previewRequestId.current;
    setPreviewDocument(document);
    setPreviewPageIndex(pageIndex);
    setPreviewMimeType(mimeType);
    setPreviewError(undefined);
    setPreviewLoading(true);
    setPreviewPath(undefined);

    try {
      const file = page
        ? await documentsApi.previewPage(document.id, page.id, mimeType)
        : await documentsApi.preview(document.id, mimeType);
      if (previewRequestId.current !== requestId) {
        FileSystem.unlink(file.path).catch(() => undefined);
        return;
      }
      setPreviewPath(file.path);
    } catch (previewLoadError) {
      if (previewRequestId.current === requestId) {
        setPreviewError(
          previewLoadError instanceof Error
            ? previewLoadError.message
            : 'Preview unavailable.',
        );
      }
    } finally {
      if (previewRequestId.current === requestId) setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    previewRequestId.current += 1;
    setPreviewDocument(undefined);
    setPreviewPath(undefined);
    setPreviewError(undefined);
  };

  const saveAnalyzedDocument = async (
    analysis: DocumentAnalysisResponse,
    aiAnalysisConsent: boolean,
  ) => {
    const document = analysis.document;
    const tempFileIds = analysis.files.map(file => file.tempFileId);
    if (!tempFileIds.length) {
      Alert.alert('Unable to save document', 'The upload did not return a temporary file.');
      return;
    }

    const payload: DocumentSavePayload = {
      tempFileIds,
      originalName: analysis.files[0]?.originalName,
      mimeType: analysis.files[0]?.mimeType,
      size: analysis.files.reduce((sum, file) => sum + file.size, 0),
      title: document.title?.trim() || analysis.files[0]?.originalName || 'Document',
      category: document.category?.trim() || 'Other',
      documentType: document.documentType?.trim() || 'Unknown',
      confidence: Number(document.confidence) || 0,
      fields: document.fields ?? {},
      reviewFields: document.reviewFields ?? [],
      rawExtractedText: document.rawExtractedText ?? document.extractedText ?? '',
      warnings: analysis.warnings ?? [],
      evidence: document.evidence ?? [],
      analysisSource: aiAnalysisConsent ? 'ai' : 'rules',
      duplicateAction: 'fail',
      owner: 'self',
      userConfirmedUnknown: (document.documentType ?? 'unknown').toLowerCase() === 'unknown',
      verified: false,
    };

    setIsImporting(true);
    try {
      const result = await documentsApi.save(payload);
      setShowAddDocumentsSheet(false);
      setDetailId(undefined);
      setQuery('');
      setFilters(defaultFilters);
      const savedName = result.document.displayName ?? result.document.title ?? document.title;
      const members = isHealthDocument(result.document)
        ? await healthApi.members().catch(() => [])
        : [];
      await refetch();
      if (members.length) {
        setHealthPrompt({ document: result.document, name: savedName, members });
        return;
      }
      const healthRecord = await syncToHealth(result.document);
      Alert.alert('Document added', `${savedName} is now in your vault${healthSummary(healthRecord)}`);
    } catch (saveError) {
      if (__DEV__) console.warn('[save payload]', JSON.stringify(payload).slice(0, 1500));
      Alert.alert(
        'Unable to save document',
        saveError instanceof Error
          ? `${saveError.message}${
              saveError instanceof ApiError
                ? ` [${saveError.status}${saveError.code ? ` ${saveError.code}` : ''}${saveError.errorId ? ` ${saveError.errorId}` : ''}]`
                : ''
            }`
          : 'Please try again.',
      );
    } finally {
      setIsImporting(false);
    }
  };

  // Best effort: the document is already saved, so a Health failure must not fail the upload.
  const healthNoteRef = useRef('');
  const setHealthNote = (note: string) => {
    healthNoteRef.current = note;
  };

  const syncToHealth = async (saved: DocumentRecord, memberId?: string) => {
    setHealthNote('');
    if (!isHealthDocument(saved)) return undefined;
    try {
      const record = await healthApi.createRecord({ documentId: saved.id, memberId, type: healthRecordType(saved) });
      if (isMemberResolution(record)) {
        setHealthNote(' It was not added to Health: create a Health profile for the patient, then add it from Health.');
        return undefined;
      }
      return record;
    } catch (syncError) {
      setHealthNote(` It was not added to Health: ${syncError instanceof Error ? syncError.message : 'please try again.'}`);
      return undefined;
    }
  };

  const healthSummary = (record?: HealthRecordDetail) => {
    if (!record) return `.${healthNoteRef.current}`;
    if (record.measurements.length) {
      return ` and Health, with ${record.measurements.length} value(s) read from it.`;
    }
    return record.processingStatus === 'failed' || record.processingStatus === 'ai_processing_disabled'
      ? ' and Health, but its values could not be read automatically.'
      : ' and Health.';
  };

  const finishHealthPrompt = async (memberId?: string) => {
    const prompt = healthPrompt;
    if (!prompt) return;
    setHealthPrompt(undefined);
    const record = memberId ? await syncToHealth(prompt.document, memberId) : undefined;
    Alert.alert('Document added', `${prompt.name} is now in your vault${healthSummary(record)}`);
  };

  const processSelectedDocument = async (
    selected: SelectedDocument,
    aiAnalysisConsent: boolean,
  ) => {
    setIsImporting(true);
    try {
      const analysis = await analyzeSelectedDocument(selected, aiAnalysisConsent);
      const document = analysis.document;
      const details = [
        `Title: ${document.title}`,
        `Category: ${document.category}`,
        `Type: ${document.documentType}`,
        `Confidence: ${Math.round(document.confidence)}%`,
      ].join('\n');

      Alert.alert('Review document', details, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save document',
          onPress: () => saveAnalyzedDocument(analysis, aiAnalysisConsent),
        },
      ]);
    } catch (importError) {
      console.warn('[documents] import failed', importError);
      Alert.alert(
        'Unable to add document',
        importError instanceof Error ? importError.message : 'Please try again.',
      );
    } finally {
      setIsImporting(false);
    }
  };

  const startDocumentImport = (
    select: () => Promise<SelectedDocument | undefined>,
  ) => {
    setShowAddDocumentsSheet(false);
    return startConsentedImport({ select, onConsent: processSelectedDocument });
  };

  const documents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const searched = (data ?? []).filter(document => {
      if (!normalizedQuery) return true;
      return [
        getDocumentTitle(document),
        document.originalName,
        document.documentType,
        documentCategory(document),
        documentPersonName(document),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
    return applyDocumentFilters(searched, filters);
  }, [data, filters, query]);

  const filterOptions = useMemo(() => {
    const all = data ?? [];
    return {
      categories: [...new Set(all.map(documentCategory))].sort(),
      people: [...new Set(all.map(documentPersonName))].sort(),
      quickCounts: Object.fromEntries(
        quickFilterLabels.map(([key]) => [key, all.filter(document => matchesQuickFilter(document, key)).length]),
      ),
    };
  }, [data]);

  const toggleSelection = (id: string) => {
    setSelectedIds(current => {
      if (current.includes(id)) return current.filter(item => item !== id);
      if (current.length >= 100) {
        Alert.alert('Selection limit reached', 'You can delete up to 100 documents at a time.');
        return current;
      }
      return [...current, id];
    });
  };

  const toggleSelectionMode = () => {
    setSelectionMode(current => !current);
    setSelectedIds([]);
    setDetailId(undefined);
  };

  const detailDocument = documents.find(document => document.id === detailId);

  const deleteSelectedDocuments = async () => {
    if (!selectedIds.length) return;
    try {
      if (selectedIds.length === 1) {
        await documentsApi.delete(selectedIds[0]);
      } else {
        await documentsApi.bulkDelete(selectedIds);
      }
      setSelectedIds([]);
      setSelectionMode(false);
      await refetch();
    } catch (deleteError) {
      Alert.alert(
        'Unable to delete documents',
        deleteError instanceof Error ? deleteError.message : 'Please try again.',
      );
    }
  };

  if (isLoading) {
    return (
      <Screen>
        <SkeletonList label="Loading documents…" />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen>
        <Stack gap="md">
          <ErrorState message="Unable to load your documents." />

          <Button
            title="Retry"
            onPress={refetch}
          />
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      padded={false}
      onRefresh={refetch}
      contentContainerStyle={styles.screenContent}
      floatingAction={
        showAddDocumentsSheet || isImporting ? null : (
          <FloatingActionButton
            accessibilityLabel="Add document"
            onPress={() => setShowAddDocumentsSheet(true)}
          />
        )
      }
    >
      <Stack
        gap="sm"
        style={[
          styles.container,
          {
            paddingTop: theme.spacing.sm,
            paddingBottom: theme.spacing.xl,
          },
        ]}
      >
        <Stack gap="sm">
        {/* Header */}
        <Row
          align="center"
          justify="space-between"
        >
          <AppText
            variant="title"
          >
            Documents
          </AppText>

          <Row
            gap="sm"
            align="center"
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Search documents"
              onPress={toggleSearch}
              style={({ pressed }) => [
                styles.headerButton,
                {
                  backgroundColor:
                    theme.colors.surface.default,
                  borderColor: theme.colors.border.default,
                },
                pressed && styles.pressed,
              ]}
            >
              <Search
                size={sizes.icon.lg}
                color={theme.colors.text.secondary}
                strokeWidth={2}
              />
            </Pressable>

            <ProfileAvatarButton />
          </Row>
        </Row>

        {/* Search (opened from the header icon) */}
        {searchOpen ? (
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: theme.colors.surface.default,
                borderColor: theme.colors.border.default,
              },
            ]}
          >
            <Search size={sizes.icon.lg} color={theme.colors.text.secondary} strokeWidth={2} />
            <SearchInput
              inputRef={searchInputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search documents..."
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close search"
              hitSlop={10}
              onPress={toggleSearch}
            >
              <X size={sizes.icon.md} color={theme.colors.text.secondary} />
            </Pressable>
          </View>
        ) : null}

        {/* DigiLocker import */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Import issued documents from DigiLocker"
          onPress={() => navigation.navigate('DigiLocker')}
          style={({ pressed }) => [
            styles.digiLockerButton,
            {
              backgroundColor: theme.colors.action.primary.default,
              borderColor: theme.colors.action.primary.default,
            },
            pressed && styles.pressed,
          ]}
        >
          <FileCheck2 size={sizes.icon.md} color={theme.colors.text.onBrand} strokeWidth={2} />
          <AppText variant="labelMd" color="onPrimary">
            Import from DigiLocker
          </AppText>
        </Pressable>

        {/* Count / Select / Filter */}
        <Row
          align="center"
          justify="space-between"
          style={styles.toolbar}
        >
          <AppText
            variant="body"
            color="secondary"
            style={styles.documentCount}
          >
            {documents.length} documents
          </AppText>

          <Row
            gap="md"
            align="center"
          >
            <Pressable
              hitSlop={10}
              onPress={toggleSelectionMode}
              style={({ pressed }) => [
                styles.toolbarButton,
                pressed && styles.pressed,
              ]}
            >
              {selectionMode ? (
                <Check
                  size={sizes.icon.md}
                  color={theme.colors.text.interactive}
                  strokeWidth={2.5}
                />
              ) : null}

              <AppText
                variant="label"
                style={[
                  styles.toolbarText,
                  {
                    color: theme.colors.text.interactive,
                  },
                ]}
              >
                {selectionMode ? 'Done' : 'Select'}
              </AppText>
            </Pressable>

            <Pressable
              hitSlop={10}
              onPress={() =>
                setShowFilters(true)
              }
              style={({ pressed }) => [
                styles.toolbarButton,
                pressed && styles.pressed,
              ]}
            >
              <SlidersHorizontal
                size={sizes.icon.md}
                color={theme.colors.text.interactive}
                strokeWidth={2}
              />

              <AppText
                variant="label"
                style={[
                  styles.toolbarText,
                  {
                    color: theme.colors.text.interactive,
                  },
                ]}
              >
                {activeFilterCount(filters) ? `Filter · ${activeFilterCount(filters)}` : 'Filter'}
              </AppText>
            </Pressable>
            {selectionMode && selectedIds.length ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${selectedIds.length} selected documents`}
                onPress={() => Alert.alert(
                  'Delete selected documents?',
                  `${selectedIds.length} document${selectedIds.length === 1 ? '' : 's'} will be permanently removed.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => { deleteSelectedDocuments(); },
                    },
                  ],
                )}
                hitSlop={10}
                style={styles.toolbarButton}
              >
                <Trash2 size={sizes.icon.md} color={theme.colors.status.danger.text} />
                <AppText variant="label" color="danger">
                  Delete ({selectedIds.length})
                </AppText>
              </Pressable>
            ) : null}
          </Row>
        </Row>

        <Row gap="sm">
          {([
            ['category', 'Category', filters.category === ALL ? 'All' : filters.category],
            ['person', 'Person', filters.person === ALL ? 'Everyone' : filters.person],
          ] as const).map(([key, title, value]) => {
            const active = value !== 'All' && value !== 'Everyone';
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={`${title}: ${value}`}
                onPress={() => setPicker(key)}
                style={({ pressed }) => [
                  styles.selectorChip,
                  {
                    backgroundColor: active ? theme.colors.selection.surface : theme.colors.surface.default,
                    borderColor: active ? theme.colors.selection.border : theme.colors.border.default,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <AppText variant="label" color="secondary">{title}:</AppText>
                <AppText variant="label" color="heading" numberOfLines={1} style={styles.selectorValue}>{value}</AppText>
                <ChevronDown size={sizes.icon.sm} color={theme.colors.icon.secondary} />
              </Pressable>
            );
          })}
        </Row>

        </Stack>

        {/* Document list */}
        {documents.length > 0 ? (
          <ListGroup strongDividers>
            {documents.map(document => {
              const isSelected = selectedIds.includes(document.id);
              const Icon = getDocumentIcon(document.documentType);
              const fromDigiLocker = document.sourceProvider === 'DIGILOCKER';

              return (
                <ListRow
                  roomy
                  key={document.id}
                  icon={<Icon size={sizes.icon.md} color={theme.colors.icon.interactive} strokeWidth={2} />}
                  title={getDocumentTitle(document)}
                  subtitle={`${fromDigiLocker ? 'DigiLocker · ' : ''}${documentPersonName(document)} · ${documentContextLabel(document)}`}
                  selected={selectionMode ? isSelected : undefined}
                  trailing={selectionMode ? <SelectionMark checked={isSelected} /> : <ChevronRight size={sizes.icon.md} color={theme.colors.icon.secondary} />}
                  onPress={() => {
                    if (selectionMode) toggleSelection(document.id);
                    else setDetailId(document.id);
                  }}
                />
              );
            })}
          </ListGroup>
        ) : (
          <Card style={styles.emptyCard}>
            <EmptyState
              title="No matching documents"
              message="Try a different search term or filter."
            />
          </Card>
        )}
      </Stack>

      <ActionSheet
        visible={showAddDocumentsSheet}
        title="Add documents"
        onClose={() => setShowAddDocumentsSheet(false)}
        options={[
          { label: 'Upload files', icon: Upload, accessibilityLabel: 'Upload a PDF or image file', onPress: () => startDocumentImport(selectDocumentFile) },
          { label: 'From gallery', icon: ImageIcon, accessibilityLabel: 'Choose an image from the gallery', onPress: () => startDocumentImport(selectImageFromGallery) },
          { label: 'Scan with camera', icon: Camera, accessibilityLabel: 'Capture a document with the camera', onPress: () => startDocumentImport(captureDocumentPhoto) },
          {
            label: 'Import from DigiLocker',
            icon: FileCheck2,
            accessibilityLabel: 'Import issued documents from DigiLocker',
            onPress: () => {
              setShowAddDocumentsSheet(false);
              navigation.navigate('DigiLocker');
            },
          },
        ]}
      />

      <ActionSheet
        visible={Boolean(healthPrompt)}
        title="Add to Health for"
        onClose={() => finishHealthPrompt()}
        options={[
          ...(healthPrompt?.members ?? []).map(member => ({
            label: member.name,
            icon: HeartPulse,
            onPress: () => finishHealthPrompt(member.id),
          })),
          { label: 'Not now', onPress: () => finishHealthPrompt() },
        ]}
      />

      <ActionSheet
        visible={picker === 'category'}
        title="Category"
        onClose={() => setPicker(undefined)}
        options={['All', ...filterOptions.categories].map(name => ({
          label: name,
          selected: (name === 'All' ? ALL : name) === filters.category,
          onPress: () => {
            setFilters(current => ({ ...current, category: name === 'All' ? ALL : name }));
            setPicker(undefined);
          },
        }))}
      />

      <ActionSheet
        visible={picker === 'person'}
        title="Person"
        onClose={() => setPicker(undefined)}
        options={['Everyone', ...filterOptions.people].map(name => ({
          label: name,
          selected: (name === 'Everyone' ? ALL : name) === filters.person,
          onPress: () => {
            setFilters(current => ({ ...current, person: name === 'Everyone' ? ALL : name }));
            setPicker(undefined);
          },
        }))}
      />

      <DocumentFilterSheet
        visible={showFilters}
        filters={filters}
        quickCounts={filterOptions.quickCounts}
        onChange={setFilters}
        onClose={() => setShowFilters(false)}
      />

      {detailDocument ? (
        <DocumentDetailSheet
          document={detailDocument}
          title={getDocumentTitle(detailDocument)}
          category={categoryFor(detailDocument.documentType)}
          icon={getDocumentIcon(detailDocument.documentType)}
          onClose={() => setDetailId(undefined)}
          onPreview={() => {
            setDetailId(undefined);
            openPreview(detailDocument);
          }}
          onChanged={refetch}
        />
      ) : null}

      <Modal visible={isImporting} transparent animationType="fade" statusBarTranslucent>
        <LoadingState overlay size={48} label="Preparing document" />
      </Modal>

      <Modal
        visible={Boolean(previewDocument)}
        animationType="slide"
        onRequestClose={closePreview}
      >
        <PreviewSafeArea>
          <PreviewModalSurface>
            {previewDocument ? (
              <>
                <View style={styles.previewHeader}>
                  {previewPages.length > 1 ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Previous document page"
                      disabled={previewPageIndex === 0}
                      onPress={() => openPreview(previewDocument, previewPageIndex - 1)}
                      style={styles.previewPageButton}
                    >
                      <ChevronLeft
                        size={sizes.icon.md}
                        color={
                          previewPageIndex === 0
                            ? theme.colors.text.tertiary
                            : theme.colors.text.primary
                        }
                      />
                    </Pressable>
                  ) : null}
                  <AppText
                    variant="heading"
                    numberOfLines={1}
                    style={styles.previewTitle}
                  >
                    {getDocumentTitle(previewDocument)}
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close document preview"
                    onPress={closePreview}
                    style={styles.previewClose}
                  >
                    <X size={sizes.icon.md} color={theme.colors.text.primary} />
                  </Pressable>
                </View>

                <View style={styles.previewContent}>
                  {previewLoading ? (
                    <LoadingState label="Loading preview…" />
                  ) : previewError ? (
                    <ErrorState message={previewError} />
                  ) : previewPath && previewMimeType === 'application/pdf' ? (
                    <Pdf
                      source={{
                        uri: previewPath.startsWith('file://')
                          ? previewPath
                          : `file://${previewPath}`,
                      }}
                      style={styles.previewFile}
                      onError={pdfError => setPreviewError(String(pdfError))}
                    />
                  ) : previewPath && previewMimeType.startsWith('image/') ? (
                    <Image
                      source={{
                        uri: previewPath.startsWith('file://')
                          ? previewPath
                          : `file://${previewPath}`,
                      }}
                      style={styles.previewFile}
                      resizeMode="contain"
                      onError={() => setPreviewError('Unable to display this image.')}
                    />
                  ) : previewPath ? (
                    <ErrorState message="Preview is unavailable for this file type." />
                  ) : null}
                </View>

                {previewPages.length > 1 ? (
                  <View style={styles.previewPaging}>
                    <AppText variant="caption" color="secondary">
                      Page {previewPageIndex + 1} of {previewPages.length}
                    </AppText>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Next document page"
                      disabled={previewPageIndex >= previewPages.length - 1}
                      onPress={() => openPreview(previewDocument, previewPageIndex + 1)}
                      style={styles.previewPageButton}
                    >
                      <ChevronRight
                        size={sizes.icon.md}
                        color={
                          previewPageIndex >= previewPages.length - 1
                            ? theme.colors.text.tertiary
                            : theme.colors.text.primary
                        }
                      />
                    </Pressable>
                  </View>
                ) : null}
              </>
            ) : null}
          </PreviewModalSurface>
        </PreviewSafeArea>
      </Modal>
    </Screen>
  );
}

/**
 * Small TextInput wrapper.
 *
 * Keeping this here avoids changing your existing SearchBar
 * globally just to match the Documents screen.
 */
function SearchInput({
  inputRef,
  value,
  onChangeText,
  placeholder,
}: {
  inputRef: React.RefObject<React.ElementRef<typeof TextInput> | null>;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.searchInputWrapper}>
      <SearchTextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        autoFocus
        placeholderTextColor={
          theme.colors.text.secondary
        }
        selectionColor={theme.colors.text.interactive}
      />
    </View>
  );
}

const SearchTextInput = TextInput;

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 0,
  },

  container: {
    paddingHorizontal: 16,
  },

  /* Header */

  headerButton: {
    width: 44,
    height: 44,
    borderRadius: radius.overlay,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.overlay,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pressed: {
    opacity: 0.72,
  },

  /* Search */

  searchContainer: {
    height: 44,
    borderRadius: radius.tile,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  digiLockerButton: {
    minHeight: 44,
    borderRadius: radius.tile,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  searchInputWrapper: {
    flex: 1,
    minWidth: 0,
  },

  /* React Native TextInput */

  searchInput: {
    flex: 1,
  },

  /* Toolbar */

  toolbar: {
    minHeight: 28,
  },

  selectorChip: {
    flex: 1,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radius.pill,
  },

  selectorValue: { flex: 1 },

  documentCount: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
  },

  toolbarButton: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  toolbarText: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
  },

  /* Filters */


  /* Document list */










  /* Empty */

  emptyCard: {
    padding: 16,
  },

  previewHeader: {
    minHeight: 58,
    gap: 12,
    paddingBottom: 12,
  },

  previewTitle: {
    flex: 1,
    minWidth: 0,
  },

  previewClose: {
    width: sizes.minimumTouchTarget,
    height: sizes.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewContent: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewFile: {
    flex: 1,
    width: '100%',
  },

  previewTextScroll: {
    width: '100%',
    flex: 1,
  },

  previewPaging: {
    minHeight: 44,
    paddingTop: 6,
  },

  previewPageButton: {
    width: 44,
    height: sizes.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },










});