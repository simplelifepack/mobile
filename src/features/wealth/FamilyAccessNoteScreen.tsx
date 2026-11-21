import React, { useEffect, useState } from 'react';
import { ArrowLeft, AlertTriangle, FileText } from 'lucide-react-native';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { Card } from '../../components/primitives/Card';
import { TextInput } from '../../components/primitives/TextInput';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';

export type FamilyAccessNote = {
  instructions: string;
  contactPerson: string;
  contactNumber: string;
};

type Props = {
  visible: boolean;
  holdingName: string;
  accountReference: string;
  userName?: string;
  initialValue: FamilyAccessNote;
  onClose: () => void;
  onSave: (note: FamilyAccessNote) => void;
};

export function FamilyAccessNoteScreen({
  visible,
  holdingName,
  accountReference,
  userName,
  initialValue,
  onClose,
  onSave,
}: Props) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState(initialValue);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!visible) return;
    setNote(initialValue);
    setError(undefined);
  }, [initialValue, visible]);

  const save = () => {
    if (!note.instructions.trim()) {
      setError('Add instructions for your family before saving.');
      return;
    }
    onSave({
      instructions: note.instructions.trim(),
      contactPerson: note.contactPerson.trim(),
      contactNumber: note.contactNumber.trim(),
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
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
            onPress={onClose}
          >
            <ArrowLeft
              size={sizes.icon.md}
              color={theme.colors.text.interactive}
            />
          </Pressable>
          <AppText variant="title">Family access note</AppText>
        </View>
        <View style={styles.context}>
          <AppText variant="caption" color="interactive">
            {userName ? `${userName} · You` : 'You'}
          </AppText>
          <AppText variant="caption" color="muted">
            Private Wealth register
          </AppText>
        </View>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Card style={styles.holdingCard}>
              <FileText
                size={sizes.icon.md}
                color={theme.colors.text.interactive}
              />
              <View style={styles.holdingDetails}>
                <AppText variant="label" numberOfLines={1}>
                  {holdingName}
                  {accountReference ? ` · ${accountReference}` : ''}
                </AppText>
                <AppText variant="bodySm" color="secondary">
                  Instructions for your family
                </AppText>
              </View>
            </Card>
            <TextInput
              label="Access instructions *"
              accessibilityLabel="Access instructions"
              placeholder="For example, which branch to contact and what documents to bring"
              value={note.instructions}
              onChangeText={value => {
                setNote(current => ({ ...current, instructions: value }));
                setError(undefined);
              }}
              multiline
              textAlignVertical="top"
              maxLength={1000}
              style={styles.instructionsInput}
            />
            <AppText variant="caption" color="muted">
              Include the institution, location, documents and next steps.
            </AppText>
            <TextInput
              label="Contact person (optional)"
              accessibilityLabel="Contact person (optional)"
              placeholder="Name"
              value={note.contactPerson}
              onChangeText={value =>
                setNote(current => ({ ...current, contactPerson: value }))
              }
              maxLength={120}
            />
            <TextInput
              label="Contact number (optional)"
              accessibilityLabel="Contact number (optional)"
              placeholder="Phone number"
              value={note.contactNumber}
              onChangeText={value =>
                setNote(current => ({ ...current, contactNumber: value }))
              }
              keyboardType="phone-pad"
              maxLength={40}
            />
            <Card
              style={[
                styles.warning,
                { backgroundColor: theme.colors.status.warning.surface },
              ]}
            >
              <View style={styles.warningTitle}>
                <AlertTriangle
                  size={sizes.icon.sm}
                  color={theme.colors.status.warning.text}
                />
                <AppText
                  variant="label"
                  style={{ color: theme.colors.status.warning.text }}
                >
                  Never save secret credentials
                </AppText>
              </View>
              <AppText variant="bodySm">
                Do not include passwords, PINs, security answers, OTPs, or other
                secret credentials.
              </AppText>
            </Card>
            {error ? (
              <AppText
                variant="caption"
                color="danger"
                accessibilityRole="alert"
              >
                {error}
              </AppText>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
        <View
          style={[
            styles.actions,
            { borderTopColor: theme.colors.border.subtle },
          ]}
        >
          <Button title="Save access note" onPress={save} />
          <Button title="Cancel" variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  navigation: {
    minHeight: sizes.header,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  context: {
    minHeight: 23,
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
  holdingCard: {
    minHeight: sizes.listRow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  holdingDetails: { flex: 1, gap: 4 },
  instructionsInput: {
    minHeight: 76,
    paddingTop: 8,
    textAlignVertical: 'top',
  },
  warning: {
    borderRadius: radius.surface,
    padding: 12,
    gap: 4,
  },
  warningTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actions: {
    padding: 16,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
