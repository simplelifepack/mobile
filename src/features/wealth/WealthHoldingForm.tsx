import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Check, ChevronDown, FileText, X } from 'lucide-react-native';

import { useAppSelector } from '../../app/store/hooks';
import { trustApi } from '../../api/trust.api';
import { wealthApi, type WealthRecord, type WealthRecordType } from '../../api/wealth.api';
import { ActionSheet } from '../../components/primitives/ActionSheet';
import { DatePickerInput } from '../../components/primitives/DatePickerInput';
import { AppText } from '../../components/primitives/AppText';
import { Row } from '../../components/primitives/Row';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { pickAndSaveDocument, type SavedWealthDocument } from './wealthDocumentImport';
import { staticColors } from '../../design/tokens/colors';
import { fontSize, lineHeight } from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';

type Kind = 'asset' | 'liability' | 'cover';

const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
const kinds: Array<{ value: Kind; label: string }> = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'cover', label: 'Cover' },
];
const typeSuggestions: Record<Kind, string[]> = {
  asset: ['Savings account', 'Current account', 'Fixed deposit', 'Mutual funds', 'Stocks', 'Bonds', 'Retirement / NPS', 'EPF / PF', 'PPF', 'Property', 'Gold', 'Crypto', 'Business ownership', 'Other'],
  liability: ['Home loan / Mortgage', 'Car loan', 'Personal loan', 'Education loan', 'Credit card', 'Business loan', 'Loan against property', 'Other'],
  cover: ['Life insurance', 'Health insurance', 'Vehicle insurance', 'Home / Property insurance', 'Personal accident insurance', 'Travel insurance', 'Other'],
};
const recordTypeByKind: Record<Kind, WealthRecordType> = {
  asset: 'ASSET',
  liability: 'LOAN_TAKEN',
  cover: 'INSURANCE',
};
const valueKeyByKind: Record<Kind, string> = {
  asset: 'value',
  liability: 'principalAmount',
  cover: 'coverageAmount',
};
const valueLabelByKind: Record<Kind, string> = {
  asset: 'Value',
  liability: 'Outstanding',
  cover: 'Cover',
};

type FormState = {
  name: string;
  kind: Kind;
  type: string;
  otherType: string;
  institution: string;
  accountRef: string;
  value: string;
  currency: string;
  memberId: string;
  renewalDate: string;
  maturityDate: string;
  accessNote: string;
  nominee: boolean;
  nomineeName: string;
};

const emptyState: FormState = {
  name: '',
  kind: 'asset',
  type: '',
  otherType: '',
  institution: '',
  accountRef: '',
  value: '',
  currency: 'INR',
  memberId: 'you',
  renewalDate: '',
  maturityDate: '',
  accessNote: '',
  nominee: false,
  nomineeName: '',
};

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function fieldValue(
  fields: Record<string, unknown>,
  reviewFields: Array<Record<string, unknown>>,
  keys: string[],
) {
  for (const key of keys) {
    const value = fields[key];
    if ((typeof value === 'string' && value.trim()) || typeof value === 'number') {
      return String(value);
    }
  }
  const match = reviewFields.find(field =>
    keys.some(key =>
      `${field.key ?? ''} ${field.label ?? ''}`.toLowerCase().includes(key.toLowerCase()),
    ),
  );
  return match?.value == null || match.value === '' ? '' : String(match.value);
}

function draftFromDocument(
  doc: { title: string; category: string; documentType: string; fields?: Record<string, unknown>; reviewFields?: Array<Record<string, unknown>> },
): Partial<FormState> {
  const fields = doc.fields ?? {};
  const review = doc.reviewFields ?? [];
  const label = `${doc.category} ${doc.documentType}`.toLowerCase();
  const kind: Kind = /insurance|policy|cover/.test(label)
    ? 'cover'
    : /loan|mortgage|liability|credit/.test(label)
      ? 'liability'
      : 'asset';
  const documentType = doc.documentType?.trim();
  const known = typeSuggestions[kind].find(item => item.toLowerCase() === documentType?.toLowerCase());
  const draft: Partial<FormState> = {
    name: doc.title,
    kind,
    type: known ?? (documentType && !/^unknown$/i.test(documentType) ? 'Other' : ''),
    otherType: known || !documentType || /^unknown$/i.test(documentType) ? '' : documentType,
    institution: fieldValue(fields, review, ['institution', 'issuer', 'bankName', 'provider', 'insurerName']),
    accountRef: fieldValue(fields, review, ['accountNumber', 'accountNumberMasked', 'policyNumber', 'referenceNumber', 'loanAccountNumber']),
    value: fieldValue(fields, review, ['amount', 'marketValue', 'coverageAmount', 'sumAssured', 'principalAmount', 'value']),
    currency: fieldValue(fields, review, ['currency']) || undefined,
    renewalDate: fieldValue(fields, review, ['renewalDate', 'expiryDate', 'validTill', 'validUntil']),
    maturityDate: fieldValue(fields, review, ['maturityDate']),
  };
  return draft;
}

export function WealthHoldingForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (record: WealthRecord) => void;
}) {
  const { theme } = useAppTheme();
  const userName = useAppSelector(state => state.auth.user?.name);
  const [f, setF] = useState<FormState>(emptyState);
  const [owners, setOwners] = useState([{ id: 'you', name: userName || 'You' }]);
  const [attached, setAttached] = useState<{ id: string; title: string }>();
  const [note, setNote] = useState<string>();
  const [picker, setPicker] = useState<'kind' | 'type' | 'currency' | 'owner' | 'source' | null>(null);
  const [working, setWorking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    trustApi.get()
      .then(response => {
        if (!active) return;
        setOwners([
          { id: 'you', name: userName || 'You' },
          ...response.members.map(member => ({ id: member.id, name: member.name })),
        ]);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [userName]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setF(current => ({ ...current, [key]: value }));
    setError(undefined);
  };

  const resolvedType = f.type === 'Other' ? f.otherType.trim() : f.type.trim();
  const ownerName = owners.find(owner => owner.id === f.memberId)?.name ?? 'You';

  const attachDocument = (document: SavedWealthDocument) => {
    setAttached({ id: document.id, title: document.title });
    const draft = draftFromDocument(document.analysis);
    let filled = 0;
    setF(current => {
      const next: FormState = { ...current };
      (Object.keys(draft) as Array<keyof FormState>).forEach(key => {
        const value = draft[key];
        if (value && !next[key]) {
          (next as Record<string, unknown>)[key] = value;
          filled += 1;
        }
      });
      return next;
    });
    setNote(filled ? 'Filled what the document states. Check and confirm.' : 'No extra details found. Fill in by hand.');
  };

  const save = async () => {
    if (!f.name.trim() || !resolvedType) {
      setError('Enter a name and choose a type.');
      return;
    }
    if ((f.renewalDate && !isoDate.test(f.renewalDate)) || (f.maturityDate && !isoDate.test(f.maturityDate))) {
      setError('Use the YYYY-MM-DD date format.');
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      const record = await wealthApi.createRecord({
        type: recordTypeByKind[f.kind],
        title: f.name.trim(),
        details: {
          assetType: f.kind === 'asset' ? resolvedType : '',
          loanType: f.kind === 'liability' ? resolvedType : '',
          insuranceType: f.kind === 'cover' ? resolvedType : '',
          type: resolvedType,
          typeClassification: f.type === 'Other' ? 'other' : 'predefined',
          provider: f.institution,
          institution: f.institution,
          accountRef: f.accountRef,
          currency: f.currency,
          memberId: f.memberId,
          renewalDate: f.kind === 'cover' ? f.renewalDate : '',
          maturityDate: f.kind === 'asset' ? f.maturityDate : '',
          accessInstruction: f.accessNote,
          nominee: f.nominee ? f.nomineeName || 'Named' : '',
          nomineeName: f.nominee ? f.nomineeName : '',
          [valueKeyByKind[f.kind]]: f.value,
          amount: f.value,
          categoryCode: f.kind === 'liability' ? 'loan' : f.kind === 'cover' ? 'insurance' : 'asset',
        },
        notes: f.accessNote,
        followUpDate: null,
        followUpNote: '',
        attachmentDocumentIds: attached ? [attached.id] : [],
      });
      onCreated(record);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to add holding.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.colors.surface.raised, borderColor: theme.colors.border.default, color: theme.colors.text.primary },
  ];
  const select = (text: string, onPress: () => void) => (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.select, { backgroundColor: theme.colors.surface.raised, borderColor: theme.colors.border.default }]}>
      <AppText variant="body" style={styles.selectText} numberOfLines={1}>{text}</AppText>
      <ChevronDown size={18} color={theme.colors.text.primary} />
    </Pressable>
  );
  const field = (label: string, child: React.ReactNode, flex = false) => (
    <View style={[styles.field, flex && styles.flex]}>
      <AppText variant="body" style={styles.label}>{label}</AppText>
      {child}
    </View>
  );
  const text = (
    key: 'name' | 'otherType' | 'institution' | 'accountRef' | 'value' | 'renewalDate' | 'maturityDate' | 'accessNote' | 'nomineeName',
    placeholder: string,
    extra: object = {},
  ) => (
    <TextInput
      value={f[key]}
      onChangeText={value => set(key, value)}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.text.tertiary}
      style={inputStyle}
      {...extra}
    />
  );
  const dateText = (key: 'renewalDate' | 'maturityDate') => (
    <DatePickerInput
      value={f[key]}
      onChangeText={value => set(key, value)}
      placeholder="YYYY-MM-DD"
      style={inputStyle}
    />
  );
  const isLiability = f.kind === 'liability';

  const pickerOptions = (() => {
    switch (picker) {
      case 'kind':
        return kinds.map(item => ({ label: item.label, selected: f.kind === item.value, onPress: () => { setF(c => ({ ...c, kind: item.value, type: '', otherType: '' })); setPicker(null); } }));
      case 'type':
        return typeSuggestions[f.kind].map(item => ({ label: item, selected: f.type === item, onPress: () => { set('type', item); setPicker(null); } }));
      case 'currency':
        return currencies.map(item => ({ label: item, selected: f.currency === item, onPress: () => { set('currency', item); setPicker(null); } }));
      case 'owner':
        return owners.map(item => ({ label: item.name, selected: f.memberId === item.id, onPress: () => { set('memberId', item.id); setPicker(null); } }));
      case 'source':
        return pickAndSaveDocument(attachDocument, () => setWorking(true), () => setWorking(false)).map(item => ({
          label: item.label,
          icon: FileText,
          onPress: () => { setPicker(null); item.onPress(); },
        }));
      default:
        return [];
    }
  })();
  const pickerTitle = { kind: 'Choose kind', type: 'Choose type', currency: 'Choose currency', owner: 'Choose owner', source: 'Add document' }[picker ?? 'kind'];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.backdrop}>
        <View style={[styles.panel, { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default }]}>
          <Row align="center" justify="space-between">
            <AppText variant="title" style={styles.title}>Add holding</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[styles.close, { backgroundColor: theme.colors.surface.raised, borderColor: theme.colors.border.default }]}>
              <X size={22} color={theme.colors.text.primary} strokeWidth={2} />
            </Pressable>
          </Row>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={[styles.banner, { backgroundColor: theme.colors.surface.raised, borderColor: theme.colors.border.default }]}>
              <FileText size={18} color={theme.colors.text.secondary} />
              <AppText variant="caption" color="secondary" style={styles.flex}>
                {attached
                  ? note ?? `${attached.title} is linked.`
                  : working
                    ? 'Reading your document…'
                    : 'Add a document now, or save this holding and attach one later.'}
              </AppText>
              {!attached && !working ? (
                <Pressable accessibilityRole="button" onPress={() => setPicker('source')}>
                  <AppText variant="label" style={{ color: theme.colors.text.interactive }}>Add document</AppText>
                </Pressable>
              ) : null}
            </View>

            {field('Name', text('name', 'e.g. Investment portfolio'))}
            <Row gap="md">
              {field('Kind', select(kinds.find(item => item.value === f.kind)?.label ?? '', () => setPicker('kind')), true)}
              {field('Type', select(f.type || 'Select type', () => setPicker('type')), true)}
            </Row>
            {f.type === 'Other' ? field('Other type', text('otherType', 'Enter type')) : null}
            <Row gap="md">
              {field('Institution', text('institution', 'Bank / insurer'), true)}
              {field('Account', text('accountRef', '...4821'), true)}
            </Row>
            <Row gap="md">
              {field(valueLabelByKind[f.kind], text('value', '0', { keyboardType: 'numeric' }), true)}
              {field('Currency', select(f.currency, () => setPicker('currency')), true)}
            </Row>
            {field('Owner', select(ownerName, () => setPicker('owner')))}
            {f.kind === 'cover' ? field('Renewal date', dateText('renewalDate')) : null}
            {f.kind === 'asset' ? field('Maturity date (deposits, retirement)', dateText('maturityDate')) : null}
            {field(
              isLiability ? 'Closure instructions for the family' : 'Access instructions for the family',
              text(
                'accessNote',
                isLiability
                  ? 'Who to contact, account details, and how to close or take over the loan'
                  : 'Where it is, who to contact, how to claim (locker no., agent, portal)',
                { multiline: true, style: [inputStyle, styles.textarea] },
              ),
            )}
            {!isLiability ? (
              <View style={styles.field}>
                <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: f.nominee }} onPress={() => set('nominee', !f.nominee)} style={styles.nomineeRow}>
                  <View style={[styles.checkbox, { borderColor: f.nominee ? theme.colors.action.primary.default : theme.colors.text.tertiary, backgroundColor: f.nominee ? theme.colors.action.primary.default : 'transparent' }]}>
                    {f.nominee ? <Check size={16} color={theme.colors.text.onBrand} /> : null}
                  </View>
                  <AppText variant="body">Nominee named</AppText>
                </Pressable>
                {f.nominee ? text('nomineeName', 'Nominee name') : null}
              </View>
            ) : null}

            {error ? <AppText variant="caption" color="danger">{error}</AppText> : null}
            <Pressable
              accessibilityRole="button"
              disabled={saving || working}
              onPress={() => { save(); }}
              style={[styles.submit, { backgroundColor: theme.colors.action.primary.default, opacity: saving || working ? 0.5 : 1 }]}
            >
              <AppText variant="heading" style={{ color: theme.colors.text.onBrand }}>{saving ? 'Saving…' : 'Add holding'}</AppText>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <ActionSheet visible={picker !== null} title={pickerTitle} options={pickerOptions} onClose={() => setPicker(null)} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: staticColors.scrim },
  panel: {
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
  title: { fontSize: fontSize.headingMd, lineHeight: lineHeight.headingMd, fontWeight: '700' },
  close: { width: 40, height: 40, borderRadius: radius.surface, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  content: { gap: 14, paddingBottom: 8 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderRadius: radius.surface },
  field: { gap: 6, minWidth: 0 },
  flex: { flex: 1 },
  label: { fontSize: fontSize.bodySm, lineHeight: lineHeight.bodySm, fontWeight: '600' },
  input: { minHeight: 48, borderWidth: 1, borderRadius: radius.surface, paddingHorizontal: 14, fontSize: fontSize.body },
  textarea: { minHeight: 90, paddingTop: 12, textAlignVertical: 'top' },
  select: { minHeight: 48, borderWidth: 1, borderRadius: radius.surface, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectText: { flex: 1, fontSize: fontSize.body },
  nomineeRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 24, height: 24, borderWidth: 1, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  submit: { minHeight: 52, borderRadius: radius.surface, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
});
