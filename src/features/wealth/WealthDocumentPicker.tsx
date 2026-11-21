import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
} from 'lucide-react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { documentsApi } from '../../api/documents.api';
import type { DocumentAnalysisResponse, DocumentRecord } from '../../api/types';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { Card } from '../../components/primitives/Card';
import { Row } from '../../components/primitives/Row';
import { Stack } from '../../components/primitives/Stack';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import { layout, space, spacing } from '../../design/tokens/spacing';
import { formatDate } from '../../utils/format';

function documentName(document: DocumentRecord) {
  return (
    document.displayName?.trim() ||
    document.title?.trim() ||
    document.originalName
  );
}

function documentDescription(document: DocumentRecord) {
  const category = document.category?.trim() || document.documentType;
  const date = formatDate(document.createdAt);
  const fileSize =
    typeof document.size === 'number' && document.size > 0
      ? `${Math.max(1, Math.round(document.size / 1024))} KB`
      : '';
  return [category, date ? `Added ${date}` : '', fileSize]
    .filter(Boolean)
    .join(' · ');
}

export function analysisFromVaultDocument(
  document: DocumentRecord,
): DocumentAnalysisResponse['document'] {
  return {
    title: documentName(document),
    category: document.category?.trim() || 'Other',
    documentType: document.documentType?.trim() || 'Unknown',
    confidence: document.confidence,
    fields: document.fields ?? {},
    reviewFields: [],
  };
}

export function WealthDocumentPicker({
  visible,
  onClose,
  onExtract,
  onUploadAnother,
}: {
  visible: boolean;
  onClose: () => void;
  onExtract: (document: DocumentRecord) => void;
  onUploadAnother: () => void;
}) {
  const { theme } = useAppTheme();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!visible) return undefined;
    let active = true;
    setLoading(true);
    setError(undefined);
    setQuery('');
    documentsApi
      .list()
      .then(items => {
        if (active) {
          setDocuments(items);
          setSelectedId(undefined);
        }
      })
      .catch(loadError => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load documents from your vault.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [visible, reloadKey]);

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return documents;
    return documents.filter(document =>
      `${documentName(document)} ${document.category ?? ''} ${document.documentType}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [documents, query]);
  const selectedDocument = documents.find(
    document => document.id === selectedId,
  );

  const extract = () => {
    if (selectedDocument) onExtract(selectedDocument);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <SafeAreaView
          style={[
            styles.safeArea,
            { backgroundColor: theme.colors.surface.canvas },
          ]}
        >
          <StatusBar
            barStyle={theme.isDark ? 'light-content' : 'dark-content'}
          />
          <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <Row align="center" gap="sm" style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={onClose}
                style={styles.back}
              >
                <ChevronLeft
                  size={sizes.icon.md}
                  color={theme.colors.icon.interactive}
                />
              </Pressable>
              <AppText variant="overviewTitle">Use a document</AppText>
            </Row>
            <Row
              align="center"
              justify="space-between"
              style={styles.familyContext}
            >
              <AppText variant="caption" color="interactive">
                You
              </AppText>
              <AppText variant="caption" color="secondary">
                Private Wealth register
              </AppText>
            </Row>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              <AppText variant="heading">Choose from your vault</AppText>

              <Stack gap="xs">
                <AppText variant="caption" color="secondary">
                  Search documents
                </AppText>
                <View
                  style={[
                    styles.search,
                    {
                      backgroundColor: theme.colors.surface.raised,
                      borderColor: theme.colors.border.default,
                    },
                  ]}
                >
                  <Search
                    size={sizes.icon.md}
                    color={theme.colors.icon.secondary}
                  />
                  <TextInput
                    accessibilityLabel="Search documents"
                    placeholder="Search by name or institution"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={query}
                    onChangeText={setQuery}
                    style={[
                      styles.searchInput,
                      { color: theme.colors.text.primary },
                    ]}
                  />
                </View>
              </Stack>

              {loading ? (
                <View style={styles.loading}>
                  <ActivityIndicator
                    color={theme.colors.icon.interactive}
                    size="small"
                  />
                  <AppText variant="bodySm" color="secondary">
                    Loading your vault…
                  </AppText>
                </View>
              ) : null}
              {error ? (
                <Stack gap="sm">
                  <AppText
                    variant="bodySm"
                    color="danger"
                    accessibilityRole="alert"
                  >
                    {error}
                  </AppText>
                  <Button
                    title="Retry"
                    variant="secondary"
                    onPress={() => setReloadKey(value => value + 1)}
                  />
                </Stack>
              ) : null}
              {!loading && !error && filteredDocuments.length === 0 ? (
                <Card style={styles.empty}>
                  <AppText variant="label">
                    {documents.length
                      ? 'No matching documents'
                      : 'No documents in your vault yet'}
                  </AppText>
                  <AppText variant="bodySm" color="secondary">
                    {documents.length
                      ? 'Try another name, category, or institution.'
                      : 'Upload a statement, policy, or loan document to start.'}
                  </AppText>
                </Card>
              ) : null}

              <Stack gap="sm">
                {filteredDocuments.map(document => {
                  const selected = document.id === selectedId;
                  return (
                    <Pressable
                      key={document.id}
                      accessibilityRole="radio"
                      accessibilityLabel={`${documentName(document)} · ${documentDescription(document)}`}
                      accessibilityState={{ selected }}
                      onPress={() => setSelectedId(document.id)}
                      style={[
                        styles.documentRow,
                        { backgroundColor: theme.colors.surface.raised },
                        selected && {
                          borderColor: theme.colors.border.interactive,
                        },
                      ]}
                    >
                      <FileText
                        size={sizes.icon.md}
                        color={theme.colors.icon.interactive}
                      />
                      <View style={styles.documentCopy}>
                        <AppText variant="label" numberOfLines={1}>
                          {documentName(document)}
                        </AppText>
                        <AppText
                          variant="caption"
                          color="secondary"
                          numberOfLines={1}
                        >
                          {documentDescription(document)}
                        </AppText>
                      </View>
                      {selected ? (
                        <Check
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                      ) : (
                        <ChevronRight
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </Stack>

              {selectedDocument ? (
                <Card
                  style={[
                    styles.selectionNotice,
                    { backgroundColor: theme.colors.surface.brandTint },
                  ]}
                >
                  <AppText variant="label" color="interactive">
                    1 document selected
                  </AppText>
                  <AppText variant="bodySm">
                    We’ll suggest an entry type and details from saved document
                    data. The original document stays in your vault; review
                    every suggested value before saving.
                  </AppText>
                </Card>
              ) : null}
            </ScrollView>

            <View style={styles.actions}>
              <Button
                title="Extract details"
                disabled={!selectedDocument || loading}
                onPress={extract}
              />
              <Button
                title="Upload another document"
                variant="secondary"
                disabled={loading}
                onPress={onUploadAnother}
              />
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  screen: { flex: 1 },
  header: {
    minHeight: sizes.minimumTouchTarget,
    paddingHorizontal: space[12],
  },
  back: {
    width: sizes.minimumTouchTarget,
    height: sizes.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyContext: {
    minHeight: 23,
    paddingHorizontal: space[20],
  },
  content: {
    padding: layout.gutter,
    gap: spacing.md,
  },
  search: {
    minHeight: sizes.button.sm + space[8],
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: space[12],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    minHeight: sizes.button.sm,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  empty: { gap: spacing.xs },
  documentRow: {
    minHeight: sizes.listRow + space[4],
    padding: space[12],
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: radius.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  documentCopy: { flex: 1, gap: spacing.xs },
  selectionNotice: {
    gap: spacing.xs,
    borderRadius: radius.surface,
  },
  actions: {
    padding: layout.gutter,
    gap: spacing.sm,
  },
});
