import React, { useEffect, useState } from 'react';
import { Alert, Image, Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { ChevronLeft, ChevronRight, Download, ImageDown, Share2, X } from 'lucide-react-native';
import Pdf from 'react-native-pdf';
import { FileSystem } from 'react-native-file-access';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { documentsApi } from '../../api/documents.api';
import type { DocumentRecord } from '../../api/types';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { AppText } from '../../components/primitives/AppText';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { canSaveAsImage, documentFileName, downloadDocumentFile, saveDocumentAsImage, shareDocumentFile } from './documentFileActions';

function removePreview(path: string) {
  FileSystem.unlink(path).catch(error => {
    console.warn('[document preview] unable to remove cached file', error);
  });
}

export function DocumentPreview({ documentId, initialDocument, onClose }: {
  documentId: string;
  initialDocument?: DocumentRecord;
  onClose: () => void;
}) {
  const { theme } = useAppTheme();
  const [document, setDocument] = useState(initialDocument);
  const [metadataError, setMetadataError] = useState<string>();
  const [pageIndex, setPageIndex] = useState(0);
  const [path, setPath] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [pdfPage, setPdfPage] = useState(0);
  const [working, setWorking] = useState(false);
  const pages = document?.pages ?? [];
  const page = pages[pageIndex];
  const mimeType = page?.mimeType ?? document?.mimeType ?? '';

  useEffect(() => {
    if (initialDocument) return;
    let active = true;
    documentsApi.getById(documentId)
      .then(result => { if (active) setDocument(result); })
      .catch(reason => {
        if (active) setMetadataError(reason instanceof Error ? reason.message : 'Unable to load document.');
      });
    return () => { active = false; };
  }, [documentId, initialDocument]);

  useEffect(() => {
    if (!document || document.source === 'GOOGLE_DRIVE') return;
    let active = true;
    let downloadedPath: string | undefined;
    setPath(undefined);
    setError(undefined);
    setPdfPage(0);
    setLoading(true);
    const request = page
      ? documentsApi.previewPage(document.id, page.id, mimeType)
      : documentsApi.preview(document.id, mimeType);
    request.then(file => {
      if (!active) {
        removePreview(file.path);
        return;
      }
      downloadedPath = file.path;
      setPath(file.path);
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : 'Preview unavailable.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
      if (downloadedPath) removePreview(downloadedPath);
    };
  }, [document, page, mimeType]);

  const title = document?.displayName ?? document?.title ?? document?.originalName ?? 'Document';
  const runFileAction = async (action: (filePath: string, name: string) => Promise<string | void | undefined>) => {
    if (!path || working) return;
    setWorking(true);
    try {
      const message = await action(path, documentFileName(title, mimeType));
      if (message) Alert.alert('Saved', message);
    } catch (reason) {
      Alert.alert('Unable to complete action', reason instanceof Error ? reason.message : 'Please try again.');
    } finally {
      setWorking(false);
    }
  };
  const fileActions = [
    { label: 'Share', Icon: Share2, run: () => runFileAction((file, name) => shareDocumentFile(file, name, mimeType)) },
    { label: 'Download', Icon: Download, run: () => runFileAction((file, name) => downloadDocumentFile(file, name)) },
    ...(canSaveAsImage(mimeType)
      ? [{ label: 'Save as image', Icon: ImageDown, run: () => runFileAction((file, name) => saveDocumentAsImage(file, name, mimeType, mimeType === 'application/pdf' ? pdfPage : 0)) }]
      : []),
  ];

  const openDrive = async () => {
    if (!document?.openUrl) {
      Alert.alert('Preview unavailable', 'This Google Drive document has no original-file link.');
      return;
    }
    try {
      await Linking.openURL(document.openUrl);
    } catch (reason) {
      Alert.alert('Unable to open Google Drive file', reason instanceof Error ? reason.message : 'Please try again.');
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
      <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.surface.canvas }]}>
        <View style={styles.header}>
          <AppText variant="heading" numberOfLines={1} style={styles.title}>
            {document ? title : 'Document preview'}
          </AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Close document preview" onPress={onClose} style={styles.iconButton}>
            <X size={sizes.icon.md} color={theme.colors.text.primary} />
          </Pressable>
        </View>
        <View style={styles.content}>
          {metadataError ? <ErrorState message={metadataError} /> :
            !document ? <LoadingState label="Loading document…" /> :
              document.source === 'GOOGLE_DRIVE' ? (
                <Pressable accessibilityRole="button" onPress={openDrive}>
                  <AppText color="primary">Open original in Google Drive</AppText>
                </Pressable>
              ) : loading ? <LoadingState label="Loading preview…" /> :
                error ? <ErrorState message={error} /> :
                  path && mimeType === 'application/pdf' ? (
                    <Pdf source={{ uri: path.startsWith('file://') ? path : `file://${path}` }}
                      style={styles.file} onError={reason => setError(String(reason))}
                      onPageChanged={page => setPdfPage(Math.max(0, page - 1))} />
                  ) : path && mimeType.startsWith('image/') ? (
                    <Image source={{ uri: path.startsWith('file://') ? path : `file://${path}` }}
                      style={styles.file} resizeMode="contain" onError={() => setError('Unable to display this image.')} />
                  ) : path ? <ErrorState message="Preview is unavailable for this file type." /> : null}
        </View>
        {path && !loading && !error && document?.source !== 'GOOGLE_DRIVE' ? (
          <View style={styles.actions}>
            {fileActions.map(({ label, Icon, run }) => (
              <Pressable key={label} accessibilityRole="button" accessibilityLabel={label} disabled={working} onPress={() => { run(); }}
                style={[styles.action, { borderColor: theme.colors.border.default, backgroundColor: theme.colors.surface.default, opacity: working ? 0.6 : 1 }]}>
                <Icon size={sizes.icon.sm} color={theme.colors.icon.interactive} />
                <AppText variant="caption" style={{ color: theme.colors.text.interactive }}>{label}</AppText>
              </Pressable>
            ))}
          </View>
        ) : null}
        {pages.length > 1 ? (
          <View style={styles.paging}>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous document page" disabled={pageIndex === 0}
              onPress={() => setPageIndex(index => index - 1)} style={styles.iconButton}>
              <ChevronLeft size={sizes.icon.md} color={pageIndex === 0 ? theme.colors.text.tertiary : theme.colors.text.primary} />
            </Pressable>
            <AppText variant="caption" color="secondary">Page {pageIndex + 1} of {pages.length}</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Next document page" disabled={pageIndex >= pages.length - 1}
              onPress={() => setPageIndex(index => index + 1)} style={styles.iconButton}>
              <ChevronRight size={sizes.icon.md} color={pageIndex >= pages.length - 1 ? theme.colors.text.tertiary : theme.colors.text.primary} />
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 12 },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 58, gap: 12, paddingBottom: 12 },
  title: { flex: 1, minWidth: 0 },
  content: { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' },
  file: { flex: 1, width: '100%' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, paddingTop: 12 },
  action: { minHeight: sizes.minimumTouchTarget, borderWidth: 1, borderRadius: radius.control, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12 },
  paging: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  iconButton: { width: sizes.minimumTouchTarget, height: sizes.minimumTouchTarget, alignItems: 'center', justifyContent: 'center' },
});
