import React, { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { ChevronLeft, ChevronRight, FileText, X } from 'lucide-react-native';
import { FileSystem } from 'react-native-file-access';
import Pdf from 'react-native-pdf';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { documentsApi } from '../../../api/documents.api';
import type { HealthRecord } from '../../../api/health.api';
import type { DocumentRecord } from '../../../api/types';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { AppText } from '../../../components/primitives/AppText';
import { Button } from '../../../components/primitives/Button';
import { useAppTheme } from '../../../design/theme/ThemeProvider';
import { radius } from '../../../design/tokens/radius';
import { sizes } from '../../../design/tokens/sizes';
import { findInsuranceDocument } from './emergencyCard';

const toUri = (path: string) => (path.startsWith('file://') ? path : `file://${path}`);

export function InsuranceCardSheet({
  visible,
  records,
  documents,
  onClose,
  onAddDocument,
}: {
  visible: boolean;
  records: HealthRecord[];
  documents: DocumentRecord[];
  onClose: () => void;
  onAddDocument: () => void;
}) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const document = useMemo(() => findInsuranceDocument(records, documents), [records, documents]);
  const pages = document?.pages ?? [];
  const [pageIndex, setPageIndex] = useState(0);
  const [path, setPath] = useState<string>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const page = pages[Math.min(pageIndex, Math.max(0, pages.length - 1))];
  const mimeType = (page?.mimeType ?? document?.mimeType ?? '').toLowerCase();
  const isDrive = document?.source === 'GOOGLE_DRIVE';
  const canPreview = mimeType.startsWith('image/') || mimeType === 'application/pdf';

  useEffect(() => {
    if (!visible || !document || isDrive || !canPreview) return;
    let active = true;
    let loaded: string | undefined;
    setPath(undefined);
    setError(undefined);
    setLoading(true);
    const request = page
      ? documentsApi.previewPage(document.id, page.id, mimeType)
      : documentsApi.preview(document.id, mimeType);
    request
      .then(file => {
        if (!active) {
          FileSystem.unlink(file.path).catch(() => undefined);
          return;
        }
        loaded = file.path;
        setPath(file.path);
      })
      .catch(previewError => {
        if (active) setError(previewError instanceof Error ? previewError.message : 'Preview unavailable.');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
      if (loaded) FileSystem.unlink(loaded).catch(() => undefined);
    };
  }, [visible, document, page, mimeType, isDrive, canPreview]);

  useEffect(() => setPageIndex(0), [document?.id, visible]);

  const title = document ? document.displayName || document.originalName : 'No insurance document added';

  const renderBody = () => {
    if (!document) {
      return (
        <View style={styles.empty}>
          <AppText variant="listTitle">No insurance document added</AppText>
          <AppText variant="bodySm" color="secondary" style={styles.centered}>
            Add your insurance document so it is available in an emergency.
          </AppText>
          <Button title="Add insurance document" onPress={onAddDocument} />
        </View>
      );
    }
    if (isDrive) {
      return (
        <View style={styles.empty}>
          <AppText variant="bodySm" color="secondary" style={styles.centered}>
            This document remains in Google Drive.
          </AppText>
          {document.openUrl ? (
            <Button title="Open in Google Drive" onPress={() => { Linking.openURL(document.openUrl as string); }} />
          ) : null}
        </View>
      );
    }
    if (!canPreview) return <ErrorState message="Inline preview is not available for this file type." />;
    if (loading) return <LoadingState label="Loading preview…" />;
    if (error) return <ErrorState message={error} />;
    if (!path) return null;
    return mimeType === 'application/pdf' ? (
      <Pdf source={{ uri: toUri(path) }} style={styles.file} onError={pdfError => setError(String(pdfError))} />
    ) : (
      <Image source={{ uri: toUri(path) }} style={styles.file} resizeMode="contain" onError={() => setError('Unable to display this image.')} />
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close insurance card"
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
            <View style={[styles.iconTile, { backgroundColor: theme.colors.surface.brandTint }]}>
              <FileText size={sizes.icon.md} color={theme.colors.icon.interactive} />
            </View>
            <View style={styles.headerCopy}>
              <AppText variant="listTitle">Insurance Card</AppText>
              <AppText variant="bodySm" color="secondary" numberOfLines={1}>{title}</AppText>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} onPress={onClose}>
              <X size={sizes.icon.md} color={theme.colors.text.primary} />
            </Pressable>
          </View>

          {document && !isDrive ? (
            <View style={styles.toolbar}>
              <AppText variant="caption" color="secondary">
                {pages.length > 1 ? `Page ${pageIndex + 1} of ${pages.length}` : 'Document preview'}
              </AppText>
              {pages.length > 1 ? (
                <View style={styles.paging}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Previous page"
                    disabled={pageIndex === 0}
                    hitSlop={8}
                    onPress={() => setPageIndex(index => Math.max(0, index - 1))}
                  >
                    <ChevronLeft size={sizes.icon.md} color={pageIndex === 0 ? theme.colors.text.tertiary : theme.colors.text.primary} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Next page"
                    disabled={pageIndex >= pages.length - 1}
                    hitSlop={8}
                    onPress={() => setPageIndex(index => Math.min(pages.length - 1, index + 1))}
                  >
                    <ChevronRight size={sizes.icon.md} color={pageIndex >= pages.length - 1 ? theme.colors.text.tertiary : theme.colors.text.primary} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={[styles.stage, { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default }]}>
            {renderBody()}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    height: '85%',
    borderTopLeftRadius: radius.overlay,
    borderTopRightRadius: radius.overlay,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  handle: { width: sizes.sheetHandle.width, height: sizes.sheetHandle.height, borderRadius: radius.pill, alignSelf: 'center', marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconTile: { width: 40, height: 40, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  paging: { flexDirection: 'row', gap: 16 },
  stage: { flex: 1, borderWidth: 1, borderRadius: radius.surface, overflow: 'hidden' },
  file: { flex: 1, width: '100%' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  centered: { textAlign: 'center' },
});
