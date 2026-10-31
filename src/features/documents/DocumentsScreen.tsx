import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { useAppTheme } from '../../design/theme/ThemeProvider';

const PreviewModalSurface = styled.View(({ theme }) => ({
  flex: 1,
  paddingTop: 12,
  paddingHorizontal: 12,
  paddingBottom: 12,
  backgroundColor: theme.colors.background,
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

function getDocumentIconColor(
  category: string,
  theme: ReturnType<typeof useAppTheme>['theme'],
) {
  switch (category) {
    case 'Identity':
      return theme.colors.primary;

    case 'Health':
      return theme.colors.danger;

    case 'Finance':
      return theme.colors.warning;

    case 'Home':
      return theme.colors.success;

    case 'Travel':
      return theme.colors.primary;

    default:
      return theme.colors.textSecondary;
  }
}

function formatDocumentDate(
  createdAt?: string,
  expiryDate?: string | null,
) {
  if (expiryDate) {
    const expiry = new Date(expiryDate);

    if (!Number.isNaN(expiry.getTime())) {
      return expiry.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: '2-digit',
      });
    }
  }

  if (createdAt) {
    const created = new Date(createdAt);

    if (!Number.isNaN(created.getTime())) {
      return created.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: '2-digit',
      });
    }
  }

  return '';
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
  const [expandedId, setExpandedId] =
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
      setExpandedId(undefined);
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
    setExpandedId(undefined);
  };

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
        gap="md"
        style={[
          styles.container,
          {
            paddingTop: theme.spacing.sm,
            paddingBottom: theme.spacing.xl,
          },
        ]}
      >
        {/* Header */}
        <Row
          align="center"
          justify="space-between"
        >
          <AppText
            variant="title"
            style={styles.headerTitle}
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
                    theme.colors.surface,
                  borderColor: theme.colors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <Search
                size={23}
                color={theme.colors.textSecondary}
                strokeWidth={2}
              />
            </Pressable>

            <View
              style={[
                styles.avatar,
                {
                  backgroundColor:
                    theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <AppText
                variant="heading"
                color="secondary"
              >
                A
              </AppText>
            </View>
          </Row>
        </Row>

        {/* Search */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor:
                theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Search
            size={23}
            color={theme.colors.textSecondary}
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
                  size={19}
                  color={theme.colors.primary}
                  strokeWidth={2.5}
                />
              ) : null}

              <AppText
                variant="label"
                style={[
                  styles.toolbarText,
                  {
                    color: theme.colors.primary,
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
                size={20}
                color={theme.colors.primary}
                strokeWidth={2}
              />

              <AppText
                variant="label"
                style={[
                  styles.toolbarText,
                  {
                    color: theme.colors.primary,
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
                <Trash2 size={19} color={theme.colors.danger} />
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
                        ? theme.colors.primary
                        : theme.colors.surfaceElevated,
                      borderColor: active
                        ? theme.colors.primary
                        : theme.colors.border,
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

        {/* Document list */}
        {documents.length > 0 ? (
          <View
            style={[
              styles.documentList,
              {
                backgroundColor:
                  theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            {documents.map((document, index) => {
              const categoryName = categoryFor(
                document.documentType,
              );

              const Icon = getDocumentIcon(
                document.documentType,
              );

              const iconColor =
                getDocumentIconColor(
                  categoryName,
                  theme,
                );

              const isSelected =
                selectedIds.includes(document.id);

              const isExpanded =
                expandedId === document.id;

              const isLast =
                index === documents.length - 1;

              const dateText =
                formatDocumentDate(
                  document.createdAt,
                  document.expiryDate,
                );

              return (
                <Pressable
                  key={document.id}
                  onPress={() => {
                    if (selectionMode) {
                      toggleSelection(document.id);
                    } else {
                      setExpandedId(
                        isExpanded
                          ? undefined
                          : document.id,
                      );
                    }
                  }}
                  style={({ pressed }) => [
                    styles.documentRow,
                    !isLast && {
                      borderBottomColor:
                        theme.colors.border,
                      borderBottomWidth: 1,
                    },
                    isSelected && {
                      backgroundColor:
                        theme.colors.surfaceElevated,
                    },
                    pressed && styles.rowPressed,
                  ]}
                >
                  {/* Icon */}
                  <View
                    style={[
                      styles.documentIcon,
                      {
                        backgroundColor:
                          `${iconColor}22`,
                      },
                    ]}
                  >
                    <Icon
                      size={23}
                      color={iconColor}
                      strokeWidth={2}
                    />
                  </View>

                  {/* Content */}
                  <View
                    style={styles.documentCopy}
                  >
                    <AppText
                      variant="heading"
                      style={
                        styles.documentTitle
                      }
                      numberOfLines={1}
                    >
                      {getDocumentTitle(
                        document,
                      )}
                    </AppText>

                    <AppText
                      variant="body"
                      color="secondary"
                      style={
                        styles.documentMeta
                      }
                      numberOfLines={1}
                    >
                      {document.documentType}
                      {dateText
                        ? ` · ${dateText}`
                        : ''}
                    </AppText>
                  </View>

                  {/* Selection / Chevron */}
                  {selectionMode ? (
                    <View
                      style={[
                        styles.selectionCircle,
                        {
                          borderColor:
                            isSelected
                              ? theme.colors.primary
                              : theme.colors.border,
                          backgroundColor:
                            isSelected
                              ? theme.colors.primary
                              : 'transparent',
                        },
                      ]}
                    >
                      {isSelected ? (
                        <Check
                          size={15}
                          color={
                            theme.colors.onPrimary
                          }
                          strokeWidth={3}
                        />
                      ) : null}
                    </View>
                  ) : (
                    <ChevronRight
                      size={22}
                      color={
                        theme.colors.textSecondary
                      }
                      strokeWidth={2}
                    />
                  )}

                  {/* Expanded details */}
                  {isExpanded &&
                  !selectionMode ? (
                    <View
                      style={[
                        styles.expandedDetails,
                        {
                          borderTopColor:
                            theme.colors.border,
                        },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        color="secondary"
                      >
                        File: {document.originalName}
                      </AppText>

                      <AppText
                        variant="caption"
                        color="secondary"
                      >
                        Category: {categoryName}
                      </AppText>

                      <AppText
                        variant="caption"
                        color="secondary"
                      >
                        Status:{' '}
                        {document.classificationStatus}
                      </AppText>

                      {document.expiryDate ? (
                        <AppText
                          variant="caption"
                          color="secondary"
                        >
                          Expires:{' '}
                          {new Date(
                            document.expiryDate,
                          ).toLocaleDateString()}
                        </AppText>
                      ) : null}

                      <Button
                        title="Preview document"
                        variant="secondary"
                        onPress={event => {
                          event.stopPropagation();
                          openPreview(document);
                        }}
                      />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
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

      <Modal visible={isImporting} transparent animationType="fade">
        <View style={styles.importProgressRoot}>
          <View
            style={[
              styles.importProgressCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
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
                        size={22}
                        color={
                          previewPageIndex === 0
                            ? theme.colors.textMuted
                            : theme.colors.textPrimary
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
                    <X size={22} color={theme.colors.textPrimary} />
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
                        size={22}
                        color={
                          previewPageIndex >= previewPages.length - 1
                            ? theme.colors.textMuted
                            : theme.colors.textPrimary
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
          theme.colors.textSecondary
        }
        selectionColor={theme.colors.primary}
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

  headerTitle: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '700',
  },

  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    borderRadius: 16,
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
    fontSize: 13,
    lineHeight: 19,
  },

  toolbarButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  toolbarText: {
    fontSize: 13,
    lineHeight: 19,
  },

  /* Filters */

  filterContent: {
    gap: 8,
    paddingRight: 16,
    paddingVertical: 2,
  },

  filterPill: {
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterText: {
    fontSize: 12,
    lineHeight: 17,
  },

  /* Document list */

  documentList: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },

  documentRow: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },

  rowPressed: {
    opacity: 0.82,
  },

  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  documentCopy: {
    flex: 1,
    minWidth: 0,
  },

  documentTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },

  documentMeta: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
  },

  selectionCircle: {
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  expandedDetails: {
    width: '100%',
    marginTop: 2,
    marginLeft: 40,
    paddingLeft: 40,
    paddingTop: 12,
    gap: 4,
    borderTopWidth: 1,
  },

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
    width: 40,
    height: 40,
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
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },


  importProgressRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
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
    borderRadius: 12,
  },







});