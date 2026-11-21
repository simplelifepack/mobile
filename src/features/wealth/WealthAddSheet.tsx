import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  HandCoins,
  Paperclip,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet } from '../../components/primitives/ActionSheet';
import { DatePickerInput } from '../../components/primitives/DatePickerInput';
import { AppText } from '../../components/primitives/AppText';
import { Row } from '../../components/primitives/Row';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import {
  wealthApi,
  type WealthRecord,
  type WealthRecordPayload,
} from '../../api/wealth.api';
import {
  documentAmount,
  pickAndSaveDocument,
  type SavedWealthDocument,
} from './wealthDocumentImport';
import {
  fontSize,
  lineHeight,
  fontWeights,
} from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';

const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export function WealthAddSheet({
  visible,
  onClose,
  onDismiss,
  onAsset,
  onInvestment,
  onInsurance,
  onLoan,
  onTransaction,
}: {
  visible: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  onAsset: () => void;
  onInvestment: () => void;
  onInsurance: () => void;
  onLoan: () => void;
  onTransaction: () => void;
}) {
  return (
    <ActionSheet
      visible={visible}
      title="Choose an entry type"
      onClose={onClose}
      onDismiss={onDismiss}
      options={[
        { label: 'Asset', icon: FileText, onPress: onAsset },
        { label: 'Investment', icon: FileText, onPress: onInvestment },
        { label: 'Insurance', icon: FileText, onPress: onInsurance },
        { label: 'Loan', icon: FileText, onPress: onLoan },
        {
          label: 'Transaction',
          icon: HandCoins,
          onPress: onTransaction,
        },
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
  initialRecord,
  initialProof,
}: {
  onClose: () => void;
  onCreated: (record: WealthRecord) => void;
  initialRecord?: WealthRecord;
  initialProof?: SavedWealthDocument;
}) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const details = initialRecord?.details;
  const initialDetailValue = (...keys: string[]) => {
    for (const key of keys) {
      const current = details?.[key];
      if (typeof current === 'string' && current.trim()) return current.trim();
      if (typeof current === 'number') return String(current);
    }
    return '';
  };
  const [direction, setDirection] = useState<'LENT' | 'BORROWED'>(
    initialRecord?.type === 'LOAN_TAKEN' ? 'BORROWED' : 'LENT',
  );
  const [whatFor, setWhatFor] = useState(
    initialRecord?.title ?? initialProof?.title ?? '',
  );
  const [amount, setAmount] = useState(
    initialDetailValue('amount', 'principalAmount', 'outstanding') ||
      (initialProof ? documentAmount(initialProof.analysis) : ''),
  );
  const [currency, setCurrency] = useState(
    initialDetailValue('currency') || 'INR',
  );
  const [date, setDate] = useState(
    initialDetailValue('transactionDate', 'date') || today(),
  );
  const [who, setWho] = useState(
    initialDetailValue(
      'counterparty',
      'who',
      'party',
      'paidTo',
      'receivedFrom',
      'borrower',
      'lender',
    ),
  );
  const [phone, setPhone] = useState(
    initialDetailValue('counterpartyPhone', 'phone', 'phoneNumber'),
  );
  const [email, setEmail] = useState(
    initialDetailValue('counterpartyEmail', 'email'),
  );
  const [paymentMethod, setPaymentMethod] = useState(
    initialDetailValue('paymentMethod'),
  );
  const [paymentReference, setPaymentReference] = useState(
    initialDetailValue(
      'paymentReference',
      'paymentRef',
      'transactionReference',
      'upiReference',
    ),
  );
  const [followUpOn, setFollowUpOn] = useState(
    initialDetailValue('followUpOn', 'dueDate') ||
      initialRecord?.followUpDate ||
      '',
  );
  const [followUpNote, setFollowUpNote] = useState(
    initialDetailValue('followUpNote') ||
      initialRecord?.followUpNote ||
      initialRecord?.notes ||
      '',
  );
  const [more, setMore] = useState(true);
  const [proof, setProof] = useState<SavedWealthDocument | undefined>(
    initialProof,
  );
  const [picker, setPicker] = useState<
    'direction' | 'currency' | 'proof' | null
  >(null);
  const [working, setWorking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const attach = (document: SavedWealthDocument) => {
    setProof(document);
    setWhatFor(current => current || document.title);
    setAmount(current => current || documentAmount(document.analysis));
  };

  const save = async () => {
    const value = Number(amount);
    if (!whatFor.trim() || !Number.isFinite(value) || value <= 0 || !date) {
      setError('Enter what for, amount, currency, which way, and date.');
      return;
    }
    if (!isoDate.test(date) || (followUpOn && !isoDate.test(followUpOn))) {
      setError('Use the YYYY-MM-DD date format.');
      return;
    }
    const amountText = String(value);
    const person = who.trim();
    const payload: WealthRecordPayload = {
      type: direction === 'BORROWED' ? 'LOAN_TAKEN' : 'LOAN_GIVEN',
      title: whatFor.trim(),
      details: {
        ...(initialRecord?.details ?? {}),
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
        counterparty: person,
        counterpartyPhone: phone.trim(),
        counterpartyEmail: email.trim(),
        paymentMethod: paymentMethod.trim(),
        paymentReference: paymentReference.trim(),
        followUpOn,
        proofStatus: proof
          ? 'attached'
          : initialRecord?.attachments.length
            ? (initialRecord.details.proofStatus ?? 'attached')
            : 'cash_no_record',
        sourceDocumentId:
          proof?.id ?? initialRecord?.details.sourceDocumentId ?? '',
        sourceDocumentCategory:
          proof?.analysis.category ??
          initialRecord?.details.sourceDocumentCategory ??
          '',
        sourceDocumentType:
          proof?.analysis.documentType ??
          initialRecord?.details.sourceDocumentType ??
          '',
      },
      notes: followUpNote,
      followUpDate: followUpOn || null,
      followUpNote,
      attachmentDocumentIds: [
        ...new Set([
          ...(initialRecord?.attachmentDocumentIds ?? []),
          ...(initialRecord?.attachments.map(item => item.documentId) ?? []),
          ...(proof ? [proof.id] : []),
        ]),
      ],
    };
    setSaving(true);
    setError(undefined);
    try {
      onCreated(
        initialRecord
          ? await wealthApi.updateRecord(initialRecord.id, payload)
          : await wealthApi.createRecord(payload),
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : initialRecord
            ? 'Unable to update transaction.'
            : 'Unable to record money lent or borrowed.',
      );
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.colors.surface.raised,
      borderColor: theme.colors.border.default,
      color: theme.colors.text.primary,
    },
  ];
  const input = (
    value: string,
    onChangeText: (value: string) => void,
    placeholder: string,
    extra: object = {},
  ) => (
    <TextInput
      value={value}
      onChangeText={text => {
        onChangeText(text);
        setError(undefined);
      }}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.text.tertiary}
      style={inputStyle}
      {...extra}
    />
  );
  const dateInput = (value: string, onChangeText: (value: string) => void) => (
    <DatePickerInput
      value={value}
      onChangeText={next => {
        onChangeText(next);
        setError(undefined);
      }}
      placeholder="YYYY-MM-DD"
      style={inputStyle}
    />
  );
  const select = (text: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.select,
        {
          backgroundColor: theme.colors.surface.raised,
          borderColor: theme.colors.border.default,
        },
      ]}
    >
      <AppText variant="body" style={styles.selectText} numberOfLines={1}>
        {text}
      </AppText>
      <ChevronDown size={sizes.icon.md} color={theme.colors.text.primary} />
    </Pressable>
  );
  const field = (label: string, child: React.ReactNode, flex = false) => (
    <View style={[styles.field, flex && styles.flex]}>
      <AppText variant="body" style={styles.label}>
        {label}
      </AppText>
      {child}
    </View>
  );

  const pickerOptions = (() => {
    switch (picker) {
      case 'direction':
        return [
          {
            label: 'I lent',
            selected: direction === 'LENT',
            onPress: () => {
              setDirection('LENT');
              setPicker(null);
            },
          },
          {
            label: 'I borrowed',
            selected: direction === 'BORROWED',
            onPress: () => {
              setDirection('BORROWED');
              setPicker(null);
            },
          },
        ];
      case 'currency':
        return currencies.map(item => ({
          label: item,
          selected: currency === item,
          onPress: () => {
            setCurrency(item);
            setPicker(null);
          },
        }));
      case 'proof':
        return pickAndSaveDocument(
          attach,
          () => setWorking(true),
          () => setWorking(false),
        ).map(item => ({
          label: item.label,
          icon: FileText,
          onPress: () => {
            setPicker(null);
            item.onPress();
          },
        }));
      default:
        return [];
    }
  })();
  const pickerTitle = {
    direction: 'Which way',
    currency: 'Choose currency',
    proof: 'Add proof',
  }[picker ?? 'direction'];

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={[
          styles.formBackdrop,
          {
            backgroundColor: theme.colors.overlay.scrim,
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        <View
          style={[
            styles.formPanel,
            {
              backgroundColor: theme.colors.surface.default,
              borderColor: theme.colors.border.default,
              paddingBottom: Math.max(24, insets.bottom + 8),
            },
          ]}
        >
          <Row align="center" justify="space-between">
            <AppText variant="heading" style={styles.title}>
              {initialRecord
                ? 'Edit transaction'
                : 'Record money lent or borrowed'}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={[
                styles.close,
                {
                  backgroundColor: theme.colors.surface.raised,
                  borderColor: theme.colors.border.default,
                },
              ]}
            >
              <X
                size={sizes.icon.md}
                color={theme.colors.text.primary}
                strokeWidth={2}
              />
            </Pressable>
          </Row>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formContent}
          >
            <AppText variant="caption" color="secondary">
              Attach the UPI screenshot, chat, or statement line, confirm who
              and how much, done. Cash with no record is fine too.
            </AppText>
            <Pressable
              accessibilityRole="button"
              disabled={working}
              onPress={() => setPicker('proof')}
              style={[
                styles.proof,
                {
                  backgroundColor: theme.colors.surface.raised,
                  borderColor: theme.colors.border.default,
                },
              ]}
            >
              <Paperclip
                size={sizes.icon.md}
                color={theme.colors.text.interactive}
              />
              <View style={styles.flex}>
                <AppText variant="label">
                  Photo · screenshot · receipt · PDF
                </AppText>
                <AppText variant="caption" color="secondary">
                  {working
                    ? 'Reading your document…'
                    : proof
                      ? `Attached: ${proof.title}`
                      : 'The proof is the record; it files into Documents too'}
                </AppText>
              </View>
            </Pressable>
            {field(
              'What for',
              input(
                whatFor,
                setWhatFor,
                'e.g. car down payment, hospital bill, wedding advance',
                { maxLength: 160 },
              ),
            )}
            <Row gap="md">
              {field(
                'Amount',
                input(amount, setAmount, '0', { keyboardType: 'decimal-pad' }),
                true,
              )}
              {field(
                'Currency',
                select(currency, () => setPicker('currency')),
                true,
              )}
            </Row>
            <Row gap="md">
              {field(
                'Which way',
                select(direction === 'LENT' ? 'I lent' : 'I borrowed', () =>
                  setPicker('direction'),
                ),
                true,
              )}
              {field('Date', dateInput(date, setDate), true)}
            </Row>
            <Pressable
              accessibilityRole="button"
              onPress={() => setMore(value => !value)}
              style={styles.moreToggle}
            >
              {more ? (
                <ChevronUp
                  size={sizes.icon.sm}
                  color={theme.colors.text.interactive}
                />
              ) : (
                <ChevronDown
                  size={sizes.icon.sm}
                  color={theme.colors.text.interactive}
                />
              )}
              <AppText
                variant="label"
                style={{ color: theme.colors.text.interactive }}
              >
                {more ? 'Fewer details' : 'More details'}
              </AppText>
            </Pressable>
            {more ? (
              <>
                {field(
                  'Who',
                  input(who, setWho, 'e.g. Rohan K (friend), Meera (sister)'),
                )}
                <Row gap="md">
                  {field('Phone', input(phone, setPhone, 'Phone number'), true)}
                  {field(
                    'Email',
                    input(email, setEmail, 'Email address', {
                      keyboardType: 'email-address',
                      autoCapitalize: 'none',
                    }),
                    true,
                  )}
                </Row>
                <Row gap="md">
                  {field(
                    'Payment method',
                    input(
                      paymentMethod,
                      setPaymentMethod,
                      'e.g. UPI, bank transfer',
                    ),
                    true,
                  )}
                  {field(
                    'Payment reference',
                    input(
                      paymentReference,
                      setPaymentReference,
                      'Transaction reference',
                    ),
                    true,
                  )}
                </Row>
                <Row gap="md">
                  {field(
                    'Follow up on',
                    dateInput(followUpOn, setFollowUpOn),
                    true,
                  )}
                  {field(
                    'Follow-up note',
                    input(
                      followUpNote,
                      setFollowUpNote,
                      'e.g. check if cheque cleared',
                      { maxLength: 2000 },
                    ),
                    true,
                  )}
                </Row>
              </>
            ) : null}
            {error ? (
              <AppText variant="caption" color="danger">
                {error}
              </AppText>
            ) : null}
            <Pressable
              accessibilityRole="button"
              disabled={saving || working}
              onPress={() => {
                save();
              }}
              style={[
                styles.submit,
                {
                  backgroundColor: theme.colors.action.primary.default,
                  opacity: saving || working ? 0.5 : 1,
                },
              ]}
            >
              <AppText
                variant="heading"
                style={{ color: theme.colors.text.onBrand }}
              >
                {saving ? 'Saving…' : 'Confirm'}
              </AppText>
            </Pressable>
          </ScrollView>
        </View>
        <ActionSheet
          embedded
          visible={picker !== null}
          title={pickerTitle}
          options={pickerOptions}
          onClose={() => setPicker(null)}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  formBackdrop: { flex: 1, justifyContent: 'flex-end' },
  formPanel: {
    width: '100%',
    maxHeight: '92%',
    borderTopWidth: 1,
    borderTopLeftRadius: radius.overlay,
    borderTopRightRadius: radius.overlay,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: fontSize.headingSm,
    lineHeight: lineHeight.headingSm,
    fontWeight: fontWeights.bold,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: radius.surface,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContent: { gap: 12, paddingBottom: 8 },
  proof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: radius.surface,
  },
  field: { gap: 6, minWidth: 0 },
  flex: { flex: 1 },
  label: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
    fontWeight: fontWeights.semibold,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.surface,
    paddingHorizontal: 12,
    fontSize: fontSize.body,
  },
  select: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.surface,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectText: { flex: 1, fontSize: fontSize.body },
  moreToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  submit: {
    minHeight: 52,
    borderRadius: radius.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
