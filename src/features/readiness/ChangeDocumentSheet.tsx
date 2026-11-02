import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Check, FileText, X } from 'lucide-react-native';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { SearchBar } from '../../components/primitives/SearchBar';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import type { DocumentRecord } from '../../api/types';
import {
  documentMatchesRequirement,
  type DerivedRequirement,
} from './calculatePackReadiness';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import { fontWeights } from '../../design/tokens/typography';

const documentName = (document: DocumentRecord) =>
  document.displayName ?? document.originalName;

export function ChangeDocumentSheet({
  requirement,
  documents,
  busy,
  error,
  onAssign,
  onClearAssignment,
  onUpload,
  onClose,
}: {
  requirement: DerivedRequirement;
  documents: DocumentRecord[];
  busy: boolean;
  error?: string;
  onAssign: (document: DocumentRecord) => void;
  onClearAssignment: () => void;
  onUpload: () => void;
  onClose: () => void;
}) {
  const { theme } = useAppTheme();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [warning, setWarning] = useState<DocumentRecord | null>(null);

  const current = requirement.matchedDocument;
  const others = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return documents
      .filter(document => document.id !== current?.id)
      .filter(
        document =>
          !needle ||
          [
            documentName(document),
            document.documentType,
            document.normalizedType,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(needle),
      );
  }, [current?.id, documents, query]);

  const selected = documents.find(document => document.id === selectedId);

  const confirm = () => {
    if (!selected) return;
    if (documentMatchesRequirement(requirement, selected)) {
      onAssign(selected);
    } else {
      setWarning(selected);
    }
  };

  const option = (document: DocumentRecord, isCurrent = false) => {
    const active = selectedId === document.id;
    const eligible =
      isCurrent || documentMatchesRequirement(requirement, document);
    return (
      <Pressable
        key={document.id}
        accessibilityRole="radio"
        accessibilityState={{ selected: active }}
        onPress={() => setSelectedId(document.id)}
        style={[
          styles.option,
          {
            borderColor: active ? theme.colors.border.interactive : theme.colors.border.default,
            backgroundColor: theme.colors.surface.raised,
          },
        ]}
      >
        <View
          style={[
            styles.radio,
            {
              borderColor: active ? theme.colors.border.interactive : theme.colors.border.default,
            },
          ]}
        >
          {active ? (
            <View
              style={[
                styles.radioDot,
                { backgroundColor: theme.colors.action.primary.default },
              ]}
            />
          ) : null}
        </View>
        {isCurrent ? (
          <Check size={sizes.icon.sm} color={theme.colors.status.success.text} />
        ) : (
          <FileText size={sizes.icon.sm} color={theme.colors.text.secondary} />
        )}
        <View style={styles.optionCopy}>
          <AppText variant="body" numberOfLines={2}>
            {documentName(document)}
          </AppText>
          {!eligible ? (
            <AppText variant="caption" color="secondary">
              May not match
            </AppText>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.overlay, { backgroundColor: theme.colors.overlay.scrim }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface.canvas,
              borderColor: theme.colors.border.default,
            },
          ]}
        >
          <View style={styles.head}>
            <View style={styles.headCopy}>
              <AppText variant="heading">
                {warning
                  ? 'This document may not match'
                  : current
                    ? 'Change document'
                    : 'Add document'}
              </AppText>
              <AppText variant="body" color="secondary">
                {requirement.title}
              </AppText>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
            >
              <X size={sizes.icon.md} color={theme.colors.text.secondary} />
            </Pressable>
          </View>

          {warning ? (
            <View style={styles.body}>
              <AppText variant="body">
                Readiness detected this document as{' '}
                <AppText variant="body" style={styles.bold}>
                  {warning.normalizedType || warning.documentType || 'Unknown'}
                </AppText>
                , which doesn't appear to satisfy{' '}
                <AppText variant="body" style={styles.bold}>
                  {requirement.title}
                </AppText>
                .
              </AppText>
              {error ? (
                <AppText variant="caption" color="danger">
                  {error}
                </AppText>
              ) : null}
              <Button
                title={busy ? 'Saving…' : 'Use anyway'}
                disabled={busy}
                onPress={() => onAssign(warning)}
              />
              <Button
                title="Choose another document"
                variant="secondary"
                disabled={busy}
                onPress={() => setWarning(null)}
              />
            </View>
          ) : (
            <>
              <ScrollView
                style={styles.list}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.listContent}
              >
                {current ? (
                  <>
                    <AppText variant="caption" color="secondary">
                      CURRENT
                    </AppText>
                    {option(current, true)}
                  </>
                ) : null}
                <AppText variant="caption" color="secondary">
                  {current ? 'OTHER DOCUMENTS' : 'YOUR DOCUMENTS'}
                </AppText>
                <SearchBar
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search your documents"
                />
                {others.length ? (
                  others.map(document => option(document))
                ) : (
                  <AppText variant="body" color="secondary">
                    No documents match your search.
                  </AppText>
                )}
              </ScrollView>
              <View style={styles.actions}>
                {error ? (
                  <AppText variant="caption" color="danger">
                    {error}
                  </AppText>
                ) : null}
                <Button
                  title="Upload new document"
                  variant="secondary"
                  onPress={onUpload}
                />
                {requirement.assignment &&
                requirement.assignmentSource !== 'AUTO' ? (
                  <Button
                    title="Use automatic match"
                    variant="secondary"
                    disabled={busy}
                    onPress={onClearAssignment}
                  />
                ) : null}
                <Button
                  title={
                    busy
                      ? 'Saving…'
                      : current
                        ? 'Confirm replacement'
                        : 'Add document'
                  }
                  disabled={busy || !selectedId || selectedId === current?.id}
                  onPress={confirm}
                />
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: radius.overlay,
    borderTopRightRadius: radius.overlay,
    borderWidth: 1,
    paddingTop: 16,
    paddingBottom: 24,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headCopy: { flex: 1, gap: 2 },
  body: { paddingHorizontal: 20, gap: 12 },
  bold: { fontWeight: fontWeights.bold },
  list: { flexGrow: 0 },
  listContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: radius.surface,
  },
  optionCopy: { flex: 1, minWidth: 0 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.surface,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: radius.control },
  actions: { paddingHorizontal: 20, paddingTop: 8, gap: 8 },
});
