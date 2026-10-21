import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { FileText, HandCoins, PenLine } from 'lucide-react-native';

import { useAppTheme } from '../../design/theme/ThemeProvider';
import { ActionSheet } from '../../components/primitives/ActionSheet';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { Row } from '../../components/primitives/Row';
import { Stack } from '../../components/primitives/Stack';
import {
  wealthApi,
  type WealthRecord,
  type WealthRecordPayload,
} from '../../api/wealth.api';

const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED'];

export function WealthAddSheet({
  visible,
  onClose,
  onFromDocument,
  onManual,
  onLentBorrowed,
}: {
  visible: boolean;
  onClose: () => void;
  onFromDocument: () => void;
  onManual: () => void;
  onLentBorrowed: () => void;
}) {
  return (
    <ActionSheet
      visible={visible}
      title="Add to Wealth"
      onClose={onClose}
      options={[
        { label: 'From a document', icon: FileText, onPress: onFromDocument },
        { label: 'Enter manually', icon: PenLine, onPress: onManual },
        { label: 'Lent or borrowed', icon: HandCoins, onPress: onLentBorrowed },
      ]}
    />
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function LentBorrowedForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (record: WealthRecord) => void;
}) {
  const { theme } = useAppTheme();
  const [direction, setDirection] = useState<'LENT' | 'BORROWED'>('LENT');
  const [whatFor, setWhatFor] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(currencies[0]);
  const [date, setDate] = useState(today());
  const [who, setWho] = useState('');
  const [followUpOn, setFollowUpOn] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const save = async () => {
    const value = Number(amount);
    if (!whatFor.trim() || !Number.isFinite(value) || value <= 0 || !date) {
      setError('Enter what for, amount, currency, which way, and date.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || (followUpOn && !/^\d{4}-\d{2}-\d{2}$/.test(followUpOn))) {
      setError('Use the YYYY-MM-DD date format.');
      return;
    }
    const amountText = String(value);
    const person = who.trim();
    const payload: WealthRecordPayload = {
      type: direction === 'BORROWED' ? 'LOAN_TAKEN' : 'LOAN_GIVEN',
      title: whatFor.trim(),
      details: {
        recordKind: 'money_lent_borrowed',
        whatFor: whatFor.trim(),
        amount: amountText,
        principalAmount: amountText,
        currency,
        direction,
        transactionDate: date,
        date,
        who: person,
        party: person,
        paidTo: direction === 'LENT' ? person : '',
        receivedFrom: direction === 'BORROWED' ? person : '',
        followUpOn,
        proofStatus: 'cash_no_record',
        sourceDocumentId: '',
        sourceDocumentCategory: '',
        sourceDocumentType: '',
      },
      notes: followUpNote,
      followUpDate: followUpOn || null,
      followUpNote,
      attachmentDocumentIds: [],
    };
    setSaving(true);
    setError(undefined);
    try {
      onCreated(await wealthApi.createRecord(payload));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to record money lent or borrowed.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      color: theme.colors.textPrimary,
    },
  ];
  const chip = (active: boolean) => [
    styles.chip,
    { borderColor: active ? theme.colors.primary : theme.colors.border },
  ];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.formBackdrop}>
        <View style={[styles.formPanel, { backgroundColor: theme.colors.background }]}>
          <Row align="center" justify="space-between">
            <AppText variant="heading">Record money lent or borrowed</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose}>
              <AppText variant="label" color="secondary">Close</AppText>
            </Pressable>
          </Row>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formContent}>
            <Row gap="xs">
              <Pressable onPress={() => setDirection('LENT')} style={chip(direction === 'LENT')}>
                <AppText variant="caption">I lent</AppText>
              </Pressable>
              <Pressable onPress={() => setDirection('BORROWED')} style={chip(direction === 'BORROWED')}>
                <AppText variant="caption">I borrowed</AppText>
              </Pressable>
            </Row>
            <Field label="What for *">
              <TextInput value={whatFor} onChangeText={setWhatFor} placeholder="e.g. Rent deposit" placeholderTextColor={theme.colors.textMuted} style={inputStyle} />
            </Field>
            <Field label="Amount *">
              <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" placeholderTextColor={theme.colors.textMuted} style={inputStyle} />
            </Field>
            <Field label="Currency">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Row gap="xs">
                  {currencies.map(code => (
                    <Pressable key={code} onPress={() => setCurrency(code)} style={chip(currency === code)}>
                      <AppText variant="caption">{code}</AppText>
                    </Pressable>
                  ))}
                </Row>
              </ScrollView>
            </Field>
            <Field label="Date *">
              <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.textMuted} style={inputStyle} />
            </Field>
            <Field label={direction === 'LENT' ? 'Lent to' : 'Borrowed from'}>
              <TextInput value={who} onChangeText={setWho} placeholder="Name" placeholderTextColor={theme.colors.textMuted} style={inputStyle} />
            </Field>
            <Field label="Follow up on">
              <TextInput value={followUpOn} onChangeText={setFollowUpOn} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.textMuted} style={inputStyle} />
            </Field>
            <Field label="Follow-up note">
              <TextInput value={followUpNote} onChangeText={setFollowUpNote} multiline placeholderTextColor={theme.colors.textMuted} style={inputStyle} />
            </Field>
            {error ? <AppText variant="caption" color="danger">{error}</AppText> : null}
            <Button title={saving ? 'Saving…' : 'Save'} disabled={saving} onPress={() => { save(); }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack gap="xs">
      <AppText variant="caption" color="secondary">{label}</AppText>
      {children}
    </Stack>
  );
}

const styles = StyleSheet.create({
  formBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.58)' },
  formPanel: {
    maxHeight: '92%',
    padding: 20,
    gap: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  formContent: { gap: 12, paddingBottom: 24 },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 11,
    fontSize: 15,
  },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
});
