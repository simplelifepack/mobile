import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  FileText,
} from 'lucide-react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  type WealthRecord,
  type WealthRecordPayload,
} from '../../api/wealth.api';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { Card } from '../../components/primitives/Card';
import { Row } from '../../components/primitives/Row';
import { Stack } from '../../components/primitives/Stack';
import { TextInput } from '../../components/primitives/TextInput';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import { layout, space, spacing } from '../../design/tokens/spacing';

function detailValue(record: WealthRecord, keys: string[]) {
  for (const key of keys) {
    const value = record.details[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return '';
}

function maskReference(value: string) {
  const suffix = value.replace(/[^a-z\d]/gi, '').slice(-4);
  return suffix ? `•••• ${suffix}` : 'Reference not added';
}

export function buildLoanAccessNotePayload(
  record: WealthRecord,
  instructions: string,
  contactPerson: string,
  contactNumber: string,
): WealthRecordPayload {
  return {
    type: record.type,
    title: record.title,
    details: {
      ...record.details,
      accessInstruction: instructions.trim(),
      accessContactName: contactPerson.trim(),
      accessContactPhone: contactNumber.trim(),
    },
    notes: record.notes,
    followUpDate: record.followUpDate,
    followUpNote: record.followUpNote,
    attachmentDocumentIds: record.attachmentDocumentIds,
  };
}

export function LoanAccessNoteScreen({
  visible,
  record,
  userName,
  onClose,
  onSave,
}: {
  visible: boolean;
  record: WealthRecord;
  userName?: string;
  onClose: () => void;
  onSave: (payload: WealthRecordPayload) => Promise<void>;
}) {
  const { theme } = useAppTheme();
  const [instructions, setInstructions] = useState(
    detailValue(record, ['accessInstruction', 'accessNote']) ||
      record.notes?.trim() ||
      '',
  );
  const [contactPerson, setContactPerson] = useState(
    detailValue(record, ['accessContactName']),
  );
  const [contactNumber, setContactNumber] = useState(
    detailValue(record, ['accessContactPhone']),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();
  const submitting = useRef(false);
  const institution = detailValue(record, [
    'institution',
    'lenderName',
    'provider',
  ]);
  const reference = detailValue(record, [
    'loanAccountNumber',
    'accountRef',
    'referenceNumber',
    'accountNumber',
  ]);

  const close = () => {
    if (!submitting.current) onClose();
  };

  const save = async () => {
    if (submitting.current) return;
    if (!instructions.trim()) {
      setError('Add instructions for your family before saving.');
      return;
    }

    submitting.current = true;
    setSaving(true);
    setError(undefined);
    try {
      await onSave(
        buildLoanAccessNotePayload(
          record,
          instructions,
          contactPerson,
          contactNumber,
        ),
      );
      setSaved(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save the family access note.',
      );
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={close}
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
                accessibilityLabel={saved ? 'Back to loan' : 'Back'}
                style={styles.back}
                disabled={saving}
                onPress={close}
              >
                <ChevronLeft
                  size={sizes.icon.md}
                  color={theme.colors.icon.interactive}
                />
              </Pressable>
              <AppText variant="overviewTitle">
                {saved ? 'Access note saved' : 'Family access note'}
              </AppText>
            </Row>
            <Row
              align="center"
              justify="space-between"
              style={styles.familyContext}
            >
              <AppText variant="caption" color="interactive">
                {userName ? `${userName} · You` : 'You'}
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
              {saved ? (
                <>
                  <View style={styles.successHeader}>
                    <CheckCircle2
                      size={48}
                      color={theme.colors.status.success.text}
                    />
                    <AppText variant="heading" align="center">
                      Family access note saved
                    </AppText>
                    <AppText variant="bodySm" color="secondary" align="center">
                      Your instructions are saved with {record.title}.
                    </AppText>
                  </View>

                  <Card style={styles.savedCard}>
                    <Row align="center" gap="xs">
                      <FileText
                        size={sizes.icon.md}
                        color={theme.colors.icon.interactive}
                      />
                      <AppText variant="label">{record.title}</AppText>
                    </Row>
                    <AppText variant="bodySm">{instructions.trim()}</AppText>
                    {contactPerson.trim() || contactNumber.trim() ? (
                      <AppText variant="caption" color="secondary">
                        {[contactPerson.trim(), contactNumber.trim()]
                          .filter(Boolean)
                          .join(' · ')}
                      </AppText>
                    ) : null}
                  </Card>

                  <Card
                    style={[
                      styles.savedNotice,
                      { backgroundColor: theme.colors.surface.brandTint },
                    ]}
                  >
                    <AppText variant="label" color="interactive">
                      You control every handoff
                    </AppText>
                    <AppText variant="bodySm">
                      This note is shared with trusted people only when you
                      choose to send a handoff.
                    </AppText>
                  </Card>
                </>
              ) : (
                <>
                  <Card style={styles.recordCard}>
                    <FileText
                      size={sizes.icon.md}
                      color={theme.colors.icon.interactive}
                    />
                    <Stack gap="xs" style={styles.recordCopy}>
                      <AppText variant="label">{record.title}</AppText>
                      <AppText variant="bodySm" color="secondary">
                        {[institution, maskReference(reference)]
                          .filter(Boolean)
                          .join(' · ')}
                      </AppText>
                    </Stack>
                  </Card>

                  <Stack gap="xs">
                    <AppText variant="heading">
                      Instructions for your family
                    </AppText>
                    <AppText variant="bodySm" color="secondary">
                      Share practical steps for contacting the lender or
                      managing this loan.
                    </AppText>
                  </Stack>

                  <TextInput
                    label="Access instructions *"
                    accessibilityLabel="Access instructions"
                    placeholder="For example, which branch to contact and what documents to bring"
                    value={instructions}
                    onChangeText={setInstructions}
                    editable={!saving}
                    multiline
                    textAlignVertical="top"
                    maxLength={1000}
                    style={styles.instructionsInput}
                  />
                  <TextInput
                    label="Contact person (optional)"
                    accessibilityLabel="Contact person (optional)"
                    placeholder="Name"
                    value={contactPerson}
                    onChangeText={setContactPerson}
                    editable={!saving}
                    maxLength={120}
                  />
                  <TextInput
                    label="Contact number (optional)"
                    accessibilityLabel="Contact number (optional)"
                    placeholder="Phone number"
                    value={contactNumber}
                    onChangeText={setContactNumber}
                    editable={!saving}
                    keyboardType="phone-pad"
                    maxLength={40}
                  />

                  <Card
                    style={[
                      styles.warning,
                      { backgroundColor: theme.colors.status.warning.surface },
                    ]}
                  >
                    <Row align="center" gap="xs">
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
                    </Row>
                    <AppText variant="bodySm">
                      Do not include passwords, PINs, security answers, OTPs, or
                      other secret credentials.
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
                </>
              )}
            </ScrollView>

            <View style={styles.actions}>
              {saved ? (
                <Button title="Back to loan" onPress={close} />
              ) : (
                <>
                  <Button
                    title={saving ? 'Saving…' : 'Save access note'}
                    disabled={saving}
                    onPress={save}
                  />
                  <Button
                    title="Cancel"
                    variant="secondary"
                    disabled={saving}
                    onPress={close}
                  />
                </>
              )}
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
  successHeader: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: space[16],
  },
  savedCard: {
    gap: spacing.sm,
  },
  savedNotice: {
    gap: spacing.xs,
    borderRadius: radius.surface,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recordCopy: { flex: 1 },
  instructionsInput: {
    minHeight: 112,
    paddingTop: space[12],
  },
  warning: {
    gap: spacing.xs,
    borderRadius: radius.surface,
  },
  actions: {
    padding: layout.gutter,
    gap: spacing.sm,
  },
});
