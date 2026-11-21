import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ArrowLeft, CheckCircle2, FileText, Upload } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileSystem } from 'react-native-file-access';

import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { ActionSheet } from '../../components/primitives/ActionSheet';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import { MAX_DOCUMENT_SIZE_BYTES } from '../../security/documentLimits';
import {
  pickAndSaveDocument,
  type SavedWealthDocument,
} from './wealthDocumentImport';
import type {
  DocumentImportStage,
  SelectedDocument,
} from '../documents/documentImport';

type UploadPhase = 'uploading' | 'encrypting' | 'extracting' | 'saving';

function formatFileSize(size: number) {
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusRow({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        styles.fileCard,
        { backgroundColor: theme.colors.surface.default },
      ]}
    >
      <CheckCircle2
        size={sizes.icon.md}
        color={theme.colors.status.success.icon}
      />
      <View style={styles.fileDetails}>
        <AppText variant="label">{title}</AppText>
        <AppText variant="bodySm" color="secondary">
          {description}
        </AppText>
      </View>
    </View>
  );
}

type Props = {
  visible: boolean;
  userName?: string;
  onClose: () => void;
  onUploaded: (document: SavedWealthDocument) => void;
};

export function WealthDocumentUploadScreen({
  visible,
  userName,
  onClose,
  onUploaded,
}: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [sourcePickerVisible, setSourcePickerVisible] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<SelectedDocument>();
  const [fileSize, setFileSize] = useState<number>();
  const [cancelUpload, setCancelUpload] = useState<() => void>();
  const [uploading, setUploading] = useState(false);
  const [phase, setPhase] = useState<UploadPhase>('uploading');
  const [cancelling, setCancelling] = useState(false);
  const [persisting, setPersisting] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const startUpload = (file: SelectedDocument, cancel: () => void) => {
    setUploadingFile(file);
    setFileSize(undefined);
    setCancelUpload(() => cancel);
    setUploading(true);
    setPhase('uploading');
    setCancelling(false);
    setPersisting(false);
    setCancelled(false);
    setErrorMessage(undefined);
    FileSystem.stat(file.path).then(
      stat => setFileSize(stat.size),
      error =>
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to read the selected file size.',
        ),
    );
  };
  const updateStage = (nextStage: DocumentImportStage) => {
    setPhase(nextStage);
  };
  const finishUpload = (wasCancelled: boolean) => {
    setUploading(false);
    setCancelling(false);
    setPersisting(false);
    setCancelUpload(undefined);
    setUploadingFile(undefined);
    setFileSize(undefined);
    if (wasCancelled) {
      setCancelled(true);
    }
  };
  const sources = useMemo(
    () =>
      pickAndSaveDocument(
        document => {
          onUploaded(document);
          onClose();
        },
        startUpload,
        finishUpload,
        error => {
          setErrorMessage(
            error instanceof Error ? error.message : 'Please try again.',
          );
        },
        updateStage,
        () => {
          setPhase('saving');
          setPersisting(true);
        },
      ),
    [onClose, onUploaded],
  );
  const requestClose = () => {
    if (uploading) {
      if (!persisting && !cancelling) {
        setCancelling(true);
        cancelUpload?.();
      }
      return;
    }
    if (sourcePickerVisible) {
      setSourcePickerVisible(false);
      return;
    }
    onClose();
  };
  const chooseSource = (onPress: () => void) => {
    setSourcePickerVisible(false);
    onPress();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={requestClose}
    >
      <View
        style={[
          styles.root,
          {
            backgroundColor: theme.colors.surface.canvas,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <View
          style={[
            styles.navigation,
            { borderBottomColor: theme.colors.border.subtle },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={12}
            onPress={requestClose}
            disabled={uploading}
          >
            <ArrowLeft
              size={sizes.icon.md}
              color={theme.colors.text.interactive}
            />
          </Pressable>
          <AppText variant="title">
            {uploading && phase !== 'uploading'
              ? 'Reading document'
              : 'Upload document'}
          </AppText>
        </View>
        <View style={styles.context}>
          <AppText
            variant="caption"
            style={{ color: theme.colors.text.interactive }}
          >
            {userName ? `${userName} · You` : 'You'}
          </AppText>
          <AppText variant="caption" color="secondary">
            Private Wealth register
          </AppText>
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {uploading ? (
            <>
              {uploadingFile ? (
                <View
                  style={[
                    styles.fileCard,
                    { backgroundColor: theme.colors.surface.default },
                  ]}
                >
                  <FileText
                    size={sizes.icon.md}
                    color={theme.colors.text.interactive}
                  />
                  <View style={styles.fileDetails}>
                    <AppText variant="label" numberOfLines={1}>
                      {uploadingFile.fileName}
                    </AppText>
                    <AppText variant="bodySm" color="secondary">
                      {cancelling
                        ? 'Cancelling upload…'
                        : phase === 'saving'
                          ? `Uploaded · ${fileSize === undefined ? 'Size unavailable' : formatFileSize(fileSize)}`
                          : phase === 'encrypting'
                            ? `Encrypting securely · ${fileSize === undefined ? 'Reading file size…' : formatFileSize(fileSize)}`
                            : phase === 'extracting'
                              ? 'Uploading and analyzing…'
                              : `Preparing upload · ${fileSize === undefined ? 'Reading file size…' : formatFileSize(fileSize)}`}
                    </AppText>
                  </View>
                  {phase === 'saving' ? (
                    <CheckCircle2
                      size={sizes.icon.md}
                      color={theme.colors.status.success.icon}
                    />
                  ) : (
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.text.interactive}
                      accessibilityLabel="Upload in progress"
                    />
                  )}
                </View>
              ) : null}
              {phase === 'extracting' ? (
                <View
                  style={[
                    styles.progressCard,
                    { backgroundColor: theme.colors.surface.brandTint },
                  ]}
                >
                  <AppText
                    variant="label"
                    style={{ color: theme.colors.text.interactive }}
                  >
                    Extracting account details…
                  </AppText>
                  <AppText variant="bodySm">
                    This usually takes a few moments. You can leave this screen
                    open while we read the document securely.
                  </AppText>
                  {!cancelling ? (
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.text.interactive}
                      accessibilityLabel="Extracting document details"
                    />
                  ) : null}
                </View>
              ) : null}
              {phase === 'saving' ? (
                <>
                  <StatusRow
                    title="Upload complete"
                    description="Secure upload finished successfully"
                  />
                  <StatusRow
                    title="Finding relevant details"
                    description="Details are ready for you to review"
                  />
                  <View
                    style={[
                      styles.progressCard,
                      { backgroundColor: theme.colors.surface.brandTint },
                    ]}
                  >
                    <AppText
                      variant="label"
                      style={{ color: theme.colors.text.interactive }}
                    >
                      Adding original to your vault
                    </AppText>
                    <AppText variant="bodySm">
                      Saving the original securely before opening the extracted
                      details for review.
                    </AppText>
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.text.interactive}
                      accessibilityLabel="Saving document to vault"
                    />
                  </View>
                </>
              ) : null}
            </>
          ) : (
            <>
              <AppText variant="heading">Add a statement or policy</AppText>
              <View
                style={[
                  styles.infoCard,
                  { backgroundColor: theme.colors.surface.brandTint },
                ]}
              >
                <AppText
                  variant="label"
                  style={{ color: theme.colors.text.interactive }}
                >
                  PDF, JPG or PNG · Up to{' '}
                  {Math.floor(MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024))} MB
                </AppText>
                <AppText variant="bodySm" color="secondary">
                  Choose a clear document with the owner, institution and
                  relevant details visible.
                </AppText>
              </View>
              <Button
                title="Choose a document"
                variant="secondary"
                accessibilityLabel="Choose a document"
                onPress={() => {
                  setCancelled(false);
                  setErrorMessage(undefined);
                  setSourcePickerVisible(true);
                }}
              />
            </>
          )}
          {cancelled ? (
            <AppText variant="bodySm" color="secondary">
              Upload cancelled. Choose a document to try again.
            </AppText>
          ) : null}
          {errorMessage ? (
            <AppText variant="bodySm" color="danger">
              {errorMessage}
            </AppText>
          ) : null}
          <AppText variant="bodySm" color="secondary">
            Your Wealth entry will not be saved until you review and confirm the
            extracted details.
          </AppText>
        </ScrollView>
        <View
          style={[
            styles.actions,
            { borderTopColor: theme.colors.border.subtle },
          ]}
        >
          {uploading ? (
            <Button
              title={
                persisting
                  ? 'Saving document…'
                  : cancelling
                    ? 'Cancelling upload…'
                    : 'Cancel upload'
              }
              variant="primary"
              disabled={persisting || cancelling}
              onPress={() => {
                setCancelling(true);
                cancelUpload?.();
              }}
            />
          ) : (
            <Button title="Close" variant="secondary" onPress={onClose} />
          )}
        </View>
        <ActionSheet
          embedded
          visible={sourcePickerVisible}
          title="Choose document source"
          options={sources.map(source => ({
            label: source.label,
            icon: Upload,
            onPress: () => chooseSource(source.onPress),
          }))}
          onClose={() => setSourcePickerVisible(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navigation: {
    minHeight: sizes.header,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  context: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  infoCard: {
    borderRadius: radius.surface,
    padding: 12,
    gap: 6,
  },
  fileCard: {
    minHeight: sizes.listRow,
    borderRadius: radius.surface,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileDetails: { flex: 1, gap: 4 },
  progressCard: { borderRadius: radius.surface, padding: 12, gap: 6 },
  actions: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
