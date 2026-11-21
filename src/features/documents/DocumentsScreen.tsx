import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ProfileAvatarButton } from '../../components/navigation/ProfileAvatarButton';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../../app/navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { ApiError } from '../../api/client';
import { wealthApi } from '../../api/wealth.api';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  Check,
  Camera,
  ChevronDown,
  ChevronRight,
  FileCheck2,
  HeartPulse,
  Image as ImageIcon,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from 'lucide-react-native';

import type {
  DocumentAnalysisResponse,
  DocumentRecord,
  DocumentSavePayload,
} from '../../api/types';

import { DocumentDetailSheet } from './DocumentDetailSheet';
import { documentIcon } from './documentIcon';
import { DocumentPreview } from './DocumentPreview';
import { DocumentFilterSheet } from './DocumentFilterSheet';
import { DocumentImportProgress } from './DocumentImportProgress';
import { recordRecentlyViewedDocument } from './recentlyViewedDocuments';
import { useHealthProfileNames } from './useHealthProfileNames';
import { DocumentBatch } from './documentImport/documentBatch';
import {
  DuplicateCancelledError,
  saveDocumentWithDuplicatePrompt,
} from './documentImport/duplicatePrompt';
import { combineSelectedDocuments } from './documentImport/analysis';
import { suggestDocumentTitle } from './documentImport/documentNaming';
import { askToCombine } from './documentImport/combinePrompt';
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
import {
  healthApi,
  isMemberResolution,
  type HealthMemberResolution,
  type HealthMember,
  type HealthRecordDetail,
} from '../../api/health.api';
import { FamilyMemberForm } from '../health/components/FamilyMemberForm';
import { healthRecordProcessingMessage } from '../health/healthRecordStatus';
import { wealthRecordPayloadFromDocument } from '../wealth/wealthDocumentRecord';
import { PrescriptionReviewSheet } from '../health/components/PrescriptionReviewSheet';
import {
  needsPrescriptionReview,
  type HealthUploadReview,
} from '../../api/healthExtraction';
import {
  documentContextLabel,
  healthRecordType,
  isHealthDocument,
} from './documentDetails';
import {
  analyzeSelectedDocument,
  captureDocumentPhoto,
  discardSelectedDocument,
  startConsentedImport,
  selectDocumentFiles,
  selectImagesFromGallery,
  type DocumentImportStage,
  type SelectedDocument,
} from './documentImport';
import { ActionSheet } from '../../components/primitives/ActionSheet';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { FloatingActionButton } from '../../components/primitives/FloatingActionButton';
import { Card } from '../../components/primitives/Card';
import { Row } from '../../components/primitives/Row';
import { sizes } from '../../design/tokens/sizes';
import {
  ListGroup,
  ListRow,
  SelectionMark,
} from '../../components/primitives/ListRow';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { SkeletonList } from '../../components/feedback/SkeletonList';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { fontSize, lineHeight } from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';

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
    /(health|medical|insurance|prescription|hospital|vaccination)/.test(value)
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

  if (/(property|home|lease|utility|rent|mortgage)/.test(value)) {
    return 'Home';
  }

  if (/(travel|flight|hotel|passport|visa)/.test(value)) {
    return 'Travel';
  }

  return 'Other';
}

function getDocumentTitle(document: {
  displayName?: string | null;
  title?: string | null;
  originalName: string;
}) {
  return document.displayName ?? document.title ?? document.originalName;
}

export function DocumentsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tabNavigation =
    useNavigation<BottomTabNavigationProp<MainTabParamList, 'Documents'>>();
  const route = useRoute<RouteProp<MainTabParamList, 'Documents'>>();
  const { theme } = useAppTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<React.ElementRef<typeof TextInput>>(null);

  const { data, error, isLoading, refetch } = useDocumentsQuery();

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<DocumentFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [picker, setPicker] = useState<'category' | 'person'>();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string>();
  const [previewDocument, setPreviewDocument] = useState<DocumentRecord>();
  const [showAddDocumentsSheet, setShowAddDocumentsSheet] = useState(false);
  const [healthPrompt, setHealthPrompt] = useState<{
    document: DocumentRecord;
    name: string;
    members: HealthMember[];
    onDone?: () => void;
  }>();
  const [isImporting, setIsImporting] = useState(false);
  const [importStage, setImportStage] =
    useState<DocumentImportStage>('encrypting');
  const [healthSyncing, setHealthSyncing] = useState(false);
  const [prescriptionReview, setPrescriptionReview] = useState<{
    analysis: DocumentAnalysisResponse;
    aiConsent: boolean;
    onDone?: () => void;
  }>();
  const [profilePrompt, setProfilePrompt] = useState<{
    document: DocumentRecord;
    name: string;
    patientName?: string | null;
    candidates: Array<{ id: string; name: string }>;
    onDone?: () => void;
  }>();
  const [batchActive, setBatchActive] = useState(false);
  const batchRef = useRef<DocumentBatch | undefined>(undefined);
  const [batchProgress, setBatchProgress] =
    useState<ReturnType<DocumentBatch['snapshot']>>();
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const mountedRef = useRef(true);
  const [profileFormVisible, setProfileFormVisible] = useState(false);

  useEffect(() => {
    const documentId = route.params?.documentId;
    if (!documentId || !data) return;
    setQuery('');
    setFilters(defaultFilters);
    const document = data.find(item => item.id === documentId);
    if (document) {
      recordRecentlyViewedDocument(document);
      setDetailId(document.id);
    } else {
      Alert.alert(
        'Document unavailable',
        'This document could not be found. It may have been removed.',
      );
    }
    tabNavigation.setParams({ documentId: undefined });
  }, [data, route.params?.documentId, tabNavigation]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
      const remaining = batchRef.current?.cancel() ?? [];
      batchRef.current = undefined;
      remaining.forEach(file => {
        discardSelectedDocument(file).catch(cleanupError =>
          console.warn(
            '[documents] unable to remove temporary file',
            cleanupError,
          ),
        );
      });
    };
  }, []);

  const toggleSearch = () => {
    if (searchOpen) setQuery('');
    setSearchOpen(open => !open);
  };

  const openPreview = async (document: DocumentRecord) => {
    recordRecentlyViewedDocument(document);
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

    setPreviewDocument(document);
  };

  const closePreview = () => {
    setPreviewDocument(undefined);
  };

  const syncToWealth = async (
    saved: DocumentRecord,
    analysis: DocumentAnalysisResponse['document'],
  ) => {
    const payload = wealthRecordPayloadFromDocument(saved, analysis);
    if (!payload) return;
    try {
      await wealthApi.createRecord(payload);
    } catch (syncError) {
      Alert.alert(
        'Document saved',
        `${saved.displayName ?? saved.title ?? saved.originalName} was saved, but was not added to Wealth: ${
          syncError instanceof Error
            ? syncError.message
            : 'Please try again from Wealth.'
        }`,
      );
    }
  };

  const saveAnalyzedDocument = async (
    analysis: DocumentAnalysisResponse,
    aiAnalysisConsent: boolean,
    onDone?: () => void,
    healthReview?: HealthUploadReview,
  ) => {
    const document = analysis.document;
    const tempFileIds = analysis.files.map(file => file.tempFileId);
    if (!tempFileIds.length) {
      if (healthReview)
        throw new Error(
          'The upload did not return a temporary file. Please select it again.',
        );
      Alert.alert(
        'Unable to save document',
        'The upload did not return a temporary file.',
        [{ text: 'OK', onPress: onDone }],
      );
      return;
    }

    const payload: DocumentSavePayload = {
      ...(healthReview ? { healthReview } : {}),
      tempFileIds,
      originalName: analysis.files[0]?.originalName,
      mimeType: analysis.files[0]?.mimeType,
      size: analysis.files.reduce((sum, file) => sum + file.size, 0),
      title: suggestDocumentTitle(analysis),
      category: document.category?.trim() || 'Other',
      documentType: document.documentType?.trim() || 'Unknown',
      confidence: Number(document.confidence) || 0,
      fields: document.fields ?? {},
      reviewFields: document.reviewFields ?? [],
      rawExtractedText:
        document.rawExtractedText ?? document.extractedText ?? '',
      warnings: analysis.warnings ?? [],
      evidence: document.evidence ?? [],
      analysisSource: aiAnalysisConsent ? 'ai' : 'rules',
      duplicateAction: 'fail',
      owner: 'self',
      userConfirmedUnknown:
        (document.documentType ?? 'unknown').toLowerCase() === 'unknown',
      verified: false,
    };

    setIsImporting(true);
    let wasSaved = false;
    try {
      const result = await saveDocumentWithDuplicatePrompt(payload);
      wasSaved = true;
      if (batchRef.current) {
        batchRef.current.markSaved();
        setBatchProgress(batchRef.current.snapshot());
      }
      if (healthReview) setPrescriptionReview(undefined);
      setShowAddDocumentsSheet(false);
      setDetailId(undefined);
      setQuery('');
      setFilters(defaultFilters);
      const savedName =
        result.document.displayName ?? result.document.title ?? document.title;
      await refetch();
      await syncToWealth(result.document, document);
      if (result.healthRecord !== undefined) {
        if (result.healthRecord) {
          await completeHealthSync(
            result.document,
            savedName,
            undefined,
            onDone,
            result.healthRecord,
          );
        } else if (document.category?.toLowerCase() === 'medical') {
          Alert.alert(
            'Document saved',
            `${savedName} was saved, but was not added to Health.`,
            [{ text: 'OK', onPress: onDone }],
          );
        } else {
          onDone?.();
        }
        return;
      }
      if (healthReview) {
        Alert.alert(
          'Document saved',
          'This server did not confirm the reviewed prescription. Check the document and contact support before trying again.',
          [{ text: 'OK', onPress: onDone }],
        );
        return;
      }
      const members = isHealthDocument(result.document)
        ? await healthApi.members()
        : [];
      if (members.length) {
        setHealthPrompt({
          document: result.document,
          name: savedName,
          members,
          onDone,
        });
        return;
      }
      await completeHealthSync(result.document, savedName, undefined, onDone);
    } catch (saveError) {
      if (wasSaved) {
        Alert.alert(
          'Document saved',
          `The document was saved, but the next step failed: ${saveError instanceof Error ? saveError.message : 'Please try again.'}`,
          [{ text: 'OK', onPress: onDone }],
        );
        return;
      }
      if (saveError instanceof DuplicateCancelledError) {
        if (healthReview) setPrescriptionReview(undefined);
        onDone?.();
        return;
      }
      if (healthReview) throw saveError;
      Alert.alert(
        'Unable to save document',
        saveError instanceof Error
          ? `${saveError.message}${
              saveError instanceof ApiError
                ? ` [${saveError.status}${saveError.code ? ` ${saveError.code}` : ''}${saveError.errorId ? ` ${saveError.errorId}` : ''}]`
                : ''
            }`
          : 'Please try again.',
        onDone
          ? [
              { text: 'Skip', onPress: onDone },
              {
                text: 'Retry',
                onPress: () => {
                  saveAnalyzedDocument(analysis, aiAnalysisConsent, onDone);
                },
              },
            ]
          : undefined,
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

  const syncToHealth = async (
    saved: DocumentRecord,
    memberId?: string,
  ): Promise<HealthRecordDetail | HealthMemberResolution | undefined> => {
    setHealthNote('');
    if (!isHealthDocument(saved)) return undefined;
    try {
      return await healthApi.createRecord({
        documentId: saved.id,
        memberId,
        type: healthRecordType(saved),
      });
    } catch (syncError) {
      setHealthNote(
        ` It was not added to Health: ${syncError instanceof Error ? syncError.message : 'please try again.'}`,
      );
      return undefined;
    }
  };

  // Adds the document to Health; when no profile matches the patient, asks which profile to use.
  const completeHealthSync = async (
    saved: DocumentRecord,
    name: string,
    memberId?: string,
    onDone?: () => void,
    savedRecord?: HealthRecordDetail | HealthMemberResolution,
  ) => {
    setHealthSyncing(true);
    setHealthNote('');
    try {
      const result =
        savedRecord ??
        (memberId || isHealthDocument(saved)
          ? await syncToHealth(saved, memberId)
          : undefined);
      if (result && isMemberResolution(result)) {
        const candidates = result.memberMatch.candidates.length
          ? result.memberMatch.candidates
          : await healthApi.members();
        setProfilePrompt({
          document: saved,
          name,
          patientName: result.patient?.name,
          candidates,
          onDone,
        });
        return;
      }
      if (healthNoteRef.current) {
        Alert.alert('Document saved', `${name}.${healthNoteRef.current}`, [
          { text: 'OK', onPress: onDone },
        ]);
      } else if (result && healthRecordProcessingMessage(result)) {
        Alert.alert(
          'Document added to Health',
          `${name}: ${healthRecordProcessingMessage(result)}`,
          [{ text: 'OK', onPress: onDone }],
        );
      } else {
        onDone?.();
      }
    } catch (memberError) {
      Alert.alert(
        'Document saved',
        `Unable to load Health profiles: ${memberError instanceof Error ? memberError.message : 'Please try again from Health.'}`,
        [{ text: 'OK', onPress: onDone }],
      );
    } finally {
      setHealthSyncing(false);
    }
  };

  const finishHealthPrompt = async (memberId?: string) => {
    const prompt = healthPrompt;
    if (!prompt) return;
    setHealthPrompt(undefined);
    if (!memberId) {
      prompt.onDone?.();
      return;
    }
    await completeHealthSync(
      prompt.document,
      prompt.name,
      memberId,
      prompt.onDone,
    );
  };

  const finishProfilePrompt = async (memberId?: string) => {
    const prompt = profilePrompt;
    if (!prompt) return;
    setProfilePrompt(undefined);
    if (!memberId) {
      prompt.onDone?.();
      return;
    }
    await completeHealthSync(
      prompt.document,
      prompt.name,
      memberId,
      prompt.onDone,
    );
  };

  const processSelectedDocument = async (
    selected: SelectedDocument,
    aiAnalysisConsent: boolean,
    onDone?: () => void,
  ) => {
    setIsImporting(true);
    setImportStage('encrypting');
    try {
      const analysis = await analyzeSelectedDocument(
        selected,
        aiAnalysisConsent,
        undefined,
        setImportStage,
      );
      if (needsPrescriptionReview(analysis.document.healthExtraction)) {
        setPrescriptionReview({
          analysis,
          aiConsent: aiAnalysisConsent,
          onDone,
        });
        return;
      }
      await saveAnalyzedDocument(analysis, aiAnalysisConsent, onDone);
    } catch (importError) {
      if (importError instanceof DuplicateCancelledError) {
        onDone?.();
        return;
      }
      console.warn('[documents] import failed', importError);
      Alert.alert(
        'Unable to add document',
        importError instanceof Error
          ? `${selected.fileName}: ${importError.message}`
          : 'Please try again.',
        [{ text: 'OK', onPress: onDone }],
      );
    } finally {
      setIsImporting(false);
    }
  };

  const advanceBatch = () => {
    if (batchTimerRef.current) return;
    batchTimerRef.current = setTimeout(() => {
      batchTimerRef.current = undefined;
      const batch = batchRef.current;
      if (!batch) return;
      const next = batch.next();
      if (!next) {
        batchRef.current = undefined;
        setBatchActive(false);
        setBatchProgress(undefined);
        return;
      }
      setBatchProgress(batch.snapshot());
      let completed = false;
      processSelectedDocument(next, batch.consent, () => {
        if (completed || batchRef.current !== batch) return;
        completed = true;
        batch.completeCurrent();
        setBatchProgress(batch.snapshot());
        advanceBatch();
      });
    }, 450);
  };

  const cancelBatch = () => {
    const batch = batchRef.current;
    if (!batch || batch.snapshot().cancelled) return;
    const remaining = batch.cancel();
    setBatchProgress(batch.snapshot());
    remaining.forEach(file => {
      discardSelectedDocument(file).catch(cleanupError =>
        console.warn(
          '[documents] unable to remove temporary file',
          cleanupError,
        ),
      );
    });
    if (!batch.snapshot().currentName && !batchTimerRef.current) advanceBatch();
  };

  const startMultipleDocumentImport = (
    select: () => Promise<SelectedDocument[] | undefined>,
  ) => {
    setShowAddDocumentsSheet(false);
    return startConsentedImport({
      select,
      onConsent: async (picked, consent) => {
        if (!picked.length) return;
        const choice =
          picked.length > 1 ? await askToCombine(picked.length) : 'separate';
        const files =
          choice === 'combine' ? [combineSelectedDocuments(picked)] : picked;
        if (choice === 'cancel' || !mountedRef.current) {
          files.forEach(file => {
            discardSelectedDocument(file).catch(cleanupError =>
              console.warn(
                '[documents] unable to remove temporary file',
                cleanupError,
              ),
            );
          });
          return;
        }
        batchRef.current = new DocumentBatch(files, consent);
        setBatchProgress(batchRef.current.snapshot());
        setBatchActive(true);
        advanceBatch();
      },
    });
  };

  const startDocumentImport = (
    select: () => Promise<SelectedDocument | undefined>,
  ) => {
    return startMultipleDocumentImport(async () => {
      const selected = await select();
      return selected ? [selected] : undefined;
    });
  };

  const {
    profileNames,
    profileMembers,
    refreshProfileNames,
    cancelProfileNamesRefresh,
  } = useHealthProfileNames();

  useFocusEffect(
    useCallback(() => {
      refreshProfileNames();
      return cancelProfileNamesRefresh;
    }, [cancelProfileNamesRefresh, refreshProfileNames]),
  );

  const documents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const searched = (data ?? []).filter(document => {
      if (!normalizedQuery) return true;
      return [
        getDocumentTitle(document),
        document.originalName,
        document.documentType,
        documentCategory(document),
        documentPersonName(document, profileNames),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
    return applyDocumentFilters(searched, filters, profileNames);
  }, [data, filters, profileNames, query]);

  const filterOptions = useMemo(() => {
    const all = data ?? [];
    return {
      categories: [...new Set(all.map(documentCategory))].sort(),
      people: [
        ...new Set([
          ...all.map(document => documentPersonName(document, profileNames)),
          ...profileMembers,
        ]),
      ].sort(),
      quickCounts: Object.fromEntries(
        quickFilterLabels.map(([key]) => [
          key,
          all.filter(document => matchesQuickFilter(document, key)).length,
        ]),
      ),
    };
  }, [data, profileMembers, profileNames]);

  const toggleSelection = (id: string) => {
    setSelectedIds(current => {
      if (current.includes(id)) return current.filter(item => item !== id);
      if (current.length >= 100) {
        Alert.alert(
          'Selection limit reached',
          'You can delete up to 100 documents at a time.',
        );
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

  const detailDocument = data?.find(document => document.id === detailId);

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
        deleteError instanceof Error
          ? deleteError.message
          : 'Please try again.',
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

          <Button title="Retry" onPress={refetch} />
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
      overlay={
        batchProgress &&
        (!batchProgress.currentName || isImporting || healthSyncing) ? (
          <DocumentImportProgress {...batchProgress} onCancel={cancelBatch} />
        ) : isImporting || healthSyncing ? (
          <LoadingState
            overlay
            size={48}
            label={
              healthSyncing
                ? 'Adding to Health'
                : importStage === 'extracting'
                  ? 'Uploading and analyzing document'
                  : 'Encrypting document securely'
            }
          />
        ) : null
      }
      floatingAction={
        showAddDocumentsSheet || isImporting || batchActive ? null : (
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
          <Row align="center" justify="space-between">
            <AppText variant="title">Documents</AppText>

            <Row gap="sm" align="center">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Search documents"
                onPress={toggleSearch}
                style={({ pressed }) => [
                  styles.headerButton,
                  {
                    backgroundColor: theme.colors.surface.default,
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
              <Search
                size={sizes.icon.lg}
                color={theme.colors.text.secondary}
                strokeWidth={2}
              />
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
            <FileCheck2
              size={sizes.icon.md}
              color={theme.colors.text.onBrand}
              strokeWidth={2}
            />
            <AppText variant="labelMd" color="onPrimary">
              Import from DigiLocker
            </AppText>
          </Pressable>

          {/* Count / Select / Filter */}
          <Row align="center" justify="space-between" style={styles.toolbar}>
            <AppText
              variant="body"
              color="secondary"
              style={styles.documentCount}
            >
              {documents.length} documents
            </AppText>

            <Row gap="md" align="center">
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
                onPress={() => setShowFilters(true)}
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
                  {activeFilterCount(filters)
                    ? `Filter · ${activeFilterCount(filters)}`
                    : 'Filter'}
                </AppText>
              </Pressable>
              {selectionMode && selectedIds.length ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${selectedIds.length} selected documents`}
                  onPress={() =>
                    Alert.alert(
                      'Delete selected documents?',
                      `${selectedIds.length} document${selectedIds.length === 1 ? '' : 's'} will be permanently removed.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            deleteSelectedDocuments();
                          },
                        },
                      ],
                    )
                  }
                  hitSlop={10}
                  style={styles.toolbarButton}
                >
                  <Trash2
                    size={sizes.icon.md}
                    color={theme.colors.status.danger.text}
                  />
                  <AppText variant="label" color="danger">
                    Delete ({selectedIds.length})
                  </AppText>
                </Pressable>
              ) : null}
            </Row>
          </Row>

          <Row gap="sm">
            {(
              [
                [
                  'category',
                  'Category',
                  filters.category === ALL ? 'All' : filters.category,
                ],
                [
                  'person',
                  'Person',
                  filters.person === ALL ? 'Everyone' : filters.person,
                ],
              ] as const
            ).map(([key, title, value]) => {
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
                      backgroundColor: active
                        ? theme.colors.selection.surface
                        : theme.colors.surface.default,
                      borderColor: active
                        ? theme.colors.selection.border
                        : theme.colors.border.default,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText variant="label" color="secondary">
                    {title}:
                  </AppText>
                  <AppText
                    variant="label"
                    color="heading"
                    numberOfLines={1}
                    style={styles.selectorValue}
                  >
                    {value}
                  </AppText>
                  <ChevronDown
                    size={sizes.icon.sm}
                    color={theme.colors.icon.secondary}
                  />
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
              const Icon = documentIcon(document);
              const fromDigiLocker = document.sourceProvider === 'DIGILOCKER';

              return (
                <ListRow
                  roomy
                  compact
                  key={document.id}
                  icon={
                    <Icon
                      size={sizes.icon.md}
                      color={theme.colors.icon.interactive}
                      strokeWidth={2}
                    />
                  }
                  title={getDocumentTitle(document)}
                  subtitle={`${fromDigiLocker ? 'DigiLocker · ' : ''}${documentPersonName(document, profileNames)} · ${documentContextLabel(document)}`}
                  selected={selectionMode ? isSelected : undefined}
                  trailing={
                    selectionMode ? (
                      <SelectionMark checked={isSelected} />
                    ) : (
                      <ChevronRight
                        size={sizes.icon.md}
                        color={theme.colors.icon.secondary}
                      />
                    )
                  }
                  onPress={() => {
                    if (selectionMode) toggleSelection(document.id);
                    else {
                      recordRecentlyViewedDocument(document);
                      setDetailId(document.id);
                    }
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

      {prescriptionReview?.analysis.document.healthExtraction ? (
        <PrescriptionReviewSheet
          extraction={prescriptionReview.analysis.document.healthExtraction}
          onClose={() => {
            const onDone = prescriptionReview.onDone;
            setPrescriptionReview(undefined);
            onDone?.();
          }}
          onSave={review =>
            saveAnalyzedDocument(
              prescriptionReview.analysis,
              prescriptionReview.aiConsent,
              prescriptionReview.onDone,
              review,
            )
          }
        />
      ) : null}
      <ActionSheet
        visible={showAddDocumentsSheet}
        title="Add documents"
        onClose={() => setShowAddDocumentsSheet(false)}
        options={[
          {
            label: 'Upload files',
            icon: Upload,
            accessibilityLabel: 'Upload PDF or image files',
            onPress: () => startMultipleDocumentImport(selectDocumentFiles),
          },
          {
            label: 'From gallery',
            icon: ImageIcon,
            accessibilityLabel: 'Choose images from the gallery',
            onPress: () => startMultipleDocumentImport(selectImagesFromGallery),
          },
          {
            label: 'Scan with camera',
            icon: Camera,
            accessibilityLabel: 'Capture a document with the camera',
            onPress: () => startDocumentImport(captureDocumentPhoto),
          },
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
        visible={Boolean(profilePrompt) && !profileFormVisible}
        title={
          profilePrompt?.patientName
            ? `Whose report is this? (${profilePrompt.patientName})`
            : 'Whose report is this?'
        }
        onClose={() => finishProfilePrompt()}
        options={[
          ...(profilePrompt?.candidates ?? []).map(member => ({
            label: member.name,
            icon: HeartPulse,
            onPress: () => finishProfilePrompt(member.id),
          })),
          {
            label: profilePrompt?.patientName
              ? `Create profile for ${profilePrompt.patientName}`
              : 'Create new profile',
            icon: HeartPulse,
            onPress: () => setProfileFormVisible(true),
          },
          { label: 'Not now', onPress: () => finishProfilePrompt() },
        ]}
      />

      {profileFormVisible ? (
        <FamilyMemberForm
          initialName={profilePrompt?.patientName ?? ''}
          onClose={() => setProfileFormVisible(false)}
          onSave={async payload => {
            const created = await healthApi.createMember(payload);
            setProfileFormVisible(false);
            await refreshProfileNames(created);
            await finishProfilePrompt(created.id);
          }}
        />
      ) : null}

      <ActionSheet
        visible={picker === 'category'}
        title="Category"
        onClose={() => setPicker(undefined)}
        options={['All', ...filterOptions.categories].map(name => ({
          label: name,
          selected: (name === 'All' ? ALL : name) === filters.category,
          onPress: () => {
            setFilters(current => ({
              ...current,
              category: name === 'All' ? ALL : name,
            }));
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
            setFilters(current => ({
              ...current,
              person: name === 'Everyone' ? ALL : name,
            }));
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
          icon={documentIcon(detailDocument)}
          onClose={() => setDetailId(undefined)}
          onPreview={() => {
            setDetailId(undefined);
            openPreview(detailDocument);
          }}
          onChanged={refetch}
        />
      ) : null}

      {previewDocument ? (
        <DocumentPreview
          documentId={previewDocument.id}
          initialDocument={previewDocument}
          onClose={closePreview}
        />
      ) : null}
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
        placeholderTextColor={theme.colors.text.secondary}
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
});
