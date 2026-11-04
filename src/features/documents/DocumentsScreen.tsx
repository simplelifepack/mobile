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
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  Check,
  Camera,
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
import { useDocumentsQuery } from '../../services/api';
import { documentsApi } from '../../api/documents.api';
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
import { LoadingState } from '../../components/feedback/LoadingState';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { fontSize, lineHeight } from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';
import { formatDate } from '../../utils/format';

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

const categories = [
  'All',
  'Identity',
  'Health',
  'Finance',
  'Home',
  'Travel',
  'Other',
];

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

function formatDocumentDate(createdAt?: string, expiryDate?: string | null) {
  return formatDate(expiryDate || createdAt);
}

export function DocumentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useAppTheme();
  const searchInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const previewRequestId = useRef(0);

  const {
    data,
    error,
    isLoading,
    refetch,
  } = useDocumentsQuery();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
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
      setCategory('All');
      await refetch();
      Alert.alert(
        'Document added',
        `${result.document.displayName ?? result.document.title ?? document.title} is now in your vault.`,
      );
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
    const normalizedQuery = query
      .trim()
      .toLowerCase();

    return (data ?? []).filter(document => {
      const title = getDocumentTitle(document);

      const searchableText = [
        title,
        document.originalName,
        document.documentType,
        categoryFor(document.documentType),
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !normalizedQuery ||
        searchableText.includes(normalizedQuery);

      const matchesCategory =
        category === 'All' ||
        categoryFor(document.documentType) === category;

      return matchesSearch && matchesCategory;
    });
  }, [category, data, query]);

  const toggleSelection = (id: string) => {
    setSelectedIds(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id],
    );
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
        <LoadingState fill label="Loading your document vault…" />
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
        gap="lg"
        style={[
          styles.container,
          {
            paddingTop: theme.spacing.sm,
            paddingBottom: theme.spacing.xl,
          },
        ]}
      >
        <Stack gap="md">
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
              onPress={() => searchInputRef.current?.focus()}
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

        {/* Search */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor:
                theme.colors.surface.default,
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
        </View>

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
              onPress={() =>
                setShowFilters(value => !value)
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
                Filter
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

        {/* Filters */}
        {showFilters ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              styles.filterContent
            }
          >
            {categories.map(item => {
              const active = category === item;

              return (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={({ pressed }) => [
                    styles.filterPill,
                    {
                      backgroundColor: active
                        ? theme.colors.action.primary.default
                        : theme.colors.surface.raised,
                      borderColor: active
                        ? theme.colors.border.interactive
                        : theme.colors.border.default,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText
                    variant="label"
                    color={
                      active
                        ? 'onPrimary'
                        : 'secondary'
                    }
                    style={styles.filterText}
                  >
                    {item}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        </Stack>

        {/* Document list */}
        {documents.length > 0 ? (
          <ListGroup>
            {documents.map(document => {
              const isSelected = selectedIds.includes(document.id);
              const Icon = getDocumentIcon(document.documentType);
              const dateText = formatDocumentDate(document.createdAt, document.expiryDate);

              return (
                <ListRow
                  key={document.id}
                  icon={<Icon size={sizes.icon.md} color={theme.colors.icon.interactive} strokeWidth={2} />}
                  title={getDocumentTitle(document)}
                  subtitle={`${document.documentType}${dateText ? ` · ${dateText}` : ''}`}
                  selected={selectionMode ? isSelected : undefined}
                  trailing={selectionMode ? <SelectionMark checked={isSelected} /> : undefined}
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

      <Modal visible={isImporting} transparent animationType="fade">
        <View style={[styles.importProgressRoot, { backgroundColor: theme.colors.overlay.scrim }]}>
          <View
            style={[
              styles.importProgressCard,
              {
                backgroundColor: theme.colors.surface.default,
                borderColor: theme.colors.border.default,
              },
            ]}
          >
            <LoadingState label="Encrypting and preparing document…" />
          </View>
        </View>
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
    height: 50,
    borderRadius: radius.tile,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    minHeight: 36,
  },

  documentCount: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
  },

  toolbarButton: {
    minHeight: sizes.minimumTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  toolbarText: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
  },

  /* Filters */

  filterContent: {
    gap: 8,
    paddingRight: 16,
    paddingVertical: 2,
  },

  filterPill: {
    minHeight: sizes.minimumTouchTarget,
    borderRadius: radius.overlay,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterText: {
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
  },

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


  importProgressRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  importProgressCard: {
    width: '100%',
    maxWidth: 360,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: radius.surface,
  },







});