import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { ChevronDown, ContactRound, FileText, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppSelector } from '../../app/store/hooks';
import { healthApi } from '../../api/health.api';
import type { DocumentRecord } from '../../api/types';
import {
  wealthApi,
  type WealthRecord,
  type WealthRecordType,
} from '../../api/wealth.api';
import { ActionSheet } from '../../components/primitives/ActionSheet';
import { DatePickerInput } from '../../components/primitives/DatePickerInput';
import { AppText } from '../../components/primitives/AppText';
import { Row } from '../../components/primitives/Row';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { type SavedWealthDocument } from './wealthDocumentImport';
import { WealthDocumentUploadScreen } from './WealthDocumentUploadScreen';
import {
  analysisFromVaultDocument,
  WealthDocumentPicker,
} from './WealthDocumentPicker';
import {
  WealthExtractedDetailsReview,
  type ReviewField,
} from './WealthExtractedDetailsReview';
import { WealthExtractedEntryConfirmation } from './WealthExtractedEntryConfirmation';
import {
  NomineeInformationScreen,
  type NomineeInformation,
} from './NomineeInformationScreen';
import { NomineeSavedScreen } from './NomineeSavedScreen';
import {
  FamilyAccessNoteScreen,
  type FamilyAccessNote,
} from './FamilyAccessNoteScreen';
import { FamilyAccessNoteSavedScreen } from './FamilyAccessNoteSavedScreen';
import {
  fontSize,
  lineHeight,
  fontWeights,
} from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import {
  validateWealthHolding,
  type WealthHoldingValidationErrors,
} from './wealthHoldingValidation';

type Kind = 'asset' | 'liability' | 'cover';

const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
const kinds: Array<{ value: Kind; label: string }> = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'cover', label: 'Cover' },
];
const typeSuggestions: Record<Kind, string[]> = {
  asset: [
    'Savings account',
    'Current account',
    'Fixed deposit',
    'Mutual funds',
    'Stocks',
    'Bonds',
    'Retirement / NPS',
    'EPF / PF',
    'PPF',
    'Property',
    'Gold',
    'Crypto',
    'Business ownership',
    'Other',
  ],
  liability: [
    'Home loan / Mortgage',
    'Car loan',
    'Personal loan',
    'Education loan',
    'Credit card',
    'Business loan',
    'Loan against property',
    'Other',
  ],
  cover: [
    'Life insurance',
    'Health insurance',
    'Vehicle insurance',
    'Home / Property insurance',
    'Personal accident insurance',
    'Travel insurance',
    'Other',
  ],
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
  ownerName: string;
  accountRef: string;
  value: string;
  currency: string;
  memberId: string;
  balanceAsOf: string;
  bankBranch: string;
  renewalDate: string;
  maturityDate: string;
  accessNote: string;
  accessContactName: string;
  accessContactPhone: string;
  nominee: boolean;
  nomineeName: string;
  nomineeRelationship: string;
  nomineePhone: string;
  nomineeAllocation: string;
  nomineeRegistrationStatus: string;
};

const emptyState: FormState = {
  name: '',
  kind: 'asset',
  type: '',
  otherType: '',
  institution: '',
  ownerName: '',
  accountRef: '',
  value: '',
  currency: 'INR',
  memberId: 'you',
  balanceAsOf: '',
  bankBranch: '',
  renewalDate: '',
  maturityDate: '',
  accessNote: '',
  accessContactName: '',
  accessContactPhone: '',
  nominee: false,
  nomineeName: '',
  nomineeRelationship: '',
  nomineePhone: '',
  nomineeAllocation: '100',
  nomineeRegistrationStatus: '',
};

function isValidationKey(
  key: keyof FormState,
): key is keyof WealthHoldingValidationErrors {
  return [
    'name',
    'type',
    'institution',
    'accountRef',
    'bankBranch',
    'value',
    'balanceAsOf',
    'renewalDate',
    'maturityDate',
  ].includes(key);
}

function fieldValue(
  fields: Record<string, unknown>,
  reviewFields: Array<Record<string, unknown>>,
  keys: string[],
) {
  for (const key of keys) {
    const value = fields[key];
    if (
      (typeof value === 'string' && value.trim()) ||
      typeof value === 'number'
    ) {
      return String(value);
    }
  }
  const match = reviewFields.find(field =>
    keys.some(key =>
      `${field.key ?? ''} ${field.label ?? ''}`
        .toLowerCase()
        .includes(key.toLowerCase()),
    ),
  );
  return match?.value == null || match.value === '' ? '' : String(match.value);
}

export function draftFromDocument(doc: {
  title: string;
  category: string;
  documentType: string;
  fields?: Record<string, unknown>;
  reviewFields?: Array<Record<string, unknown>>;
}): Partial<FormState> {
  const fields = doc.fields ?? {};
  const review = doc.reviewFields ?? [];
  const label = `${doc.category} ${doc.documentType}`.toLowerCase();
  const kind: Kind = /insurance|policy|cover/.test(label)
    ? 'cover'
    : /loan|mortgage|liability|credit/.test(label)
      ? 'liability'
      : 'asset';
  const documentType = doc.documentType?.trim();
  const known = typeSuggestions[kind].find(
    item => item.toLowerCase() === documentType?.toLowerCase(),
  );
  const draft: Partial<FormState> = {
    name:
      fieldValue(fields, review, [
        'accountName',
        'accountTitle',
        'account name',
      ]) || doc.title,
    kind,
    type:
      known ??
      (documentType && !/^unknown$/i.test(documentType) ? 'Other' : ''),
    otherType:
      known || !documentType || /^unknown$/i.test(documentType)
        ? ''
        : documentType,
    institution: fieldValue(fields, review, [
      'institution',
      'issuer',
      'bankName',
      'provider',
      'insurerName',
    ]),
    ownerName: fieldValue(fields, review, [
      'ownerName',
      'owner',
      'accountHolder',
      'holderName',
      'memberName',
    ]),
    accountRef: fieldValue(fields, review, [
      'accountNumber',
      'accountNumberMasked',
      'policyNumber',
      'referenceNumber',
      'loanAccountNumber',
    ]),
    value: fieldValue(fields, review, [
      'amount',
      'marketValue',
      'balance',
      'currentBalance',
      'outstanding',
      'coverageAmount',
      'sumAssured',
      'principalAmount',
      'value',
    ]),
    currency: fieldValue(fields, review, ['currency']) || undefined,
    balanceAsOf: fieldValue(fields, review, [
      'balanceAsOf',
      'statementDate',
      'asOfDate',
    ]),
    bankBranch: fieldValue(fields, review, ['branchName', 'branch']),
    accessNote: fieldValue(fields, review, ['accessInstruction', 'accessNote']),
    accessContactName: fieldValue(fields, review, ['accessContactName']),
    accessContactPhone: fieldValue(fields, review, ['accessContactPhone']),
    nomineeName: fieldValue(fields, review, [
      'nomineeName',
      'nominee',
      'beneficiary',
    ]),
    nominee: Boolean(
      fieldValue(fields, review, [
        'nomineeName',
        'nominee',
        'beneficiary',
      ]).trim(),
    ),
    nomineeRelationship: fieldValue(fields, review, [
      'nomineeRelationship',
      'nomineeRelation',
      'beneficiaryRelationship',
    ]),
    nomineePhone: fieldValue(fields, review, [
      'nomineePhone',
      'nomineeMobile',
      'beneficiaryPhone',
    ]),
    nomineeAllocation:
      fieldValue(fields, review, ['nomineeAllocation', 'allocation']) || '100',
    nomineeRegistrationStatus: fieldValue(fields, review, [
      'nomineeRegistrationStatus',
      'registrationStatus',
    ]),
    renewalDate: fieldValue(fields, review, [
      'renewalDate',
      'expiryDate',
      'validTill',
      'validUntil',
    ]),
    maturityDate: fieldValue(fields, review, ['maturityDate']),
  };
  return draft;
}

export function WealthHoldingForm({
  onClose,
  onCreated,
  initialKind = 'asset',
  initialRecord,
  initialDocument,
}: {
  onClose: () => void;
  onCreated: (record: WealthRecord) => void;
  initialKind?: Kind;
  initialRecord?: WealthRecord;
  initialDocument?: SavedWealthDocument;
}) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const userName = useAppSelector(state => state.auth.user?.name);
  const initialDocumentDraft = initialDocument
    ? draftFromDocument(initialDocument.analysis)
    : undefined;
  const [f, setF] = useState<FormState>(() => {
    if (initialDocumentDraft) {
      return { ...emptyState, ...initialDocumentDraft };
    }
    if (!initialRecord) return { ...emptyState, kind: initialKind };
    const details = initialRecord.details;
    const kind: Kind =
      initialRecord.type === 'INSURANCE'
        ? 'cover'
        : initialRecord.type === 'LOAN_TAKEN'
          ? 'liability'
          : 'asset';
    const nomineeName = String(details.nomineeName ?? '');
    return {
      ...emptyState,
      name: initialRecord.title,
      kind,
      type: String(
        details.assetType ??
          details.loanType ??
          details.insuranceType ??
          details.type ??
          '',
      ),
      institution: String(details.institution ?? details.provider ?? ''),
      accountRef: String(
        details.accountRef ??
          details.accountNumber ??
          details.policyNumber ??
          '',
      ),
      value: String(
        details.value ??
          details.principalAmount ??
          details.coverageAmount ??
          details.amount ??
          '',
      ),
      currency: String(details.currency ?? 'INR'),
      memberId: String(details.memberId ?? 'you'),
      balanceAsOf: String(details.balanceAsOf ?? ''),
      bankBranch: String(details.branchName ?? details.branch ?? ''),
      renewalDate: String(details.renewalDate ?? ''),
      maturityDate: String(details.maturityDate ?? ''),
      accessNote: String(
        details.accessInstruction ??
          details.accessNote ??
          initialRecord.notes ??
          '',
      ),
      accessContactName: String(details.accessContactName ?? ''),
      accessContactPhone: String(details.accessContactPhone ?? ''),
      nominee: Boolean(nomineeName || details.nominee),
      nomineeName,
      nomineeRelationship: String(
        details.nomineeRelationship ?? details.nomineeRelation ?? '',
      ),
      nomineePhone: String(details.nomineePhone ?? details.nomineeMobile ?? ''),
      nomineeAllocation: String(details.nomineeAllocation ?? '100'),
      nomineeRegistrationStatus: String(
        details.nomineeRegistrationStatus ?? details.registrationStatus ?? '',
      ),
    };
  });
  const [owners, setOwners] = useState([
    { id: 'you', name: userName || 'You' },
  ]);
  const [attached, setAttached] = useState<
    Array<{ id: string; title: string }>
  >(() =>
    initialDocument
      ? [
          {
            id: initialDocument.id,
            title: initialDocument.title,
          },
        ]
      : [],
  );
  const [note, setNote] = useState<string | undefined>(() => {
    if (!initialDocumentDraft) return undefined;
    const hasExtractedValues = Object.entries(initialDocumentDraft).some(
      ([key, value]) =>
        key !== 'name' &&
        key !== 'kind' &&
        typeof value === 'string' &&
        Boolean(value.trim()),
    );
    return hasExtractedValues
      ? 'Filled what the document states. Check and confirm.'
      : 'No extra details found. Fill in by hand.';
  });
  const [picker, setPicker] = useState<
    'kind' | 'type' | 'currency' | 'owner' | 'source' | null
  >(null);
  const [vaultPickerVisible, setVaultPickerVisible] = useState(false);
  const [documentUploadVisible, setDocumentUploadVisible] = useState(false);
  const [nomineeInformationVisible, setNomineeInformationVisible] =
    useState(false);
  const [nomineeSavedVisible, setNomineeSavedVisible] = useState(false);
  const [familyAccessNoteVisible, setFamilyAccessNoteVisible] = useState(false);
  const [familyAccessNoteSavedVisible, setFamilyAccessNoteSavedVisible] =
    useState(false);
  const [reviewStep, setReviewStep] = useState(Boolean(initialDocument));
  const [confirmStep, setConfirmStep] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [validationErrors, setValidationErrors] =
    useState<WealthHoldingValidationErrors>({});

  useEffect(() => {
    let active = true;
    healthApi
      .members()
      .then(response => {
        if (!active) return;
        setOwners([
          { id: 'you', name: userName || 'You' },
          ...response
            .filter(member => member.relation.toLowerCase() !== 'self')
            .map(member => ({ id: member.id, name: member.name })),
        ]);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [userName]);

  useEffect(() => {
    const extractedOwner = (initialDocumentDraft?.ownerName ?? '')
      .trim()
      .toLowerCase();
    if (!extractedOwner) return;
    const match = owners.find(
      owner => owner.name.trim().toLowerCase() === extractedOwner,
    );
    if (match) {
      setF(current =>
        current.memberId === match.id
          ? current
          : { ...current, memberId: match.id },
      );
    }
  }, [initialDocumentDraft?.ownerName, owners]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setF(current => ({ ...current, [key]: value }));
    setValidationErrors(current => {
      const next = { ...current };
      if (isValidationKey(key)) delete next[key];
      if (key === 'otherType') delete next.type;
      return next;
    });
    setError(undefined);
  };

  const resolvedType = f.type === 'Other' ? f.otherType.trim() : f.type.trim();
  const ownerName =
    f.ownerName || owners.find(owner => owner.id === f.memberId)?.name || 'You';
  const reviewValues = {
    entryType: resolvedType,
    accountName: f.name,
    owner: f.ownerName || ownerName,
    accountRef: f.accountRef,
    balance: f.value,
    balanceAsOf: f.balanceAsOf,
    institution: f.institution,
    bankBranch: f.bankBranch,
  };
  const updateReviewField = (field: ReviewField, value: string) => {
    setError(undefined);
    setF(current => {
      switch (field) {
        case 'entryType':
          return { ...current, type: 'Other', otherType: value };
        case 'accountName':
          return { ...current, name: value };
        case 'accountRef':
          return { ...current, accountRef: value };
        case 'balance':
          return { ...current, value };
        case 'balanceAsOf':
          return { ...current, balanceAsOf: value };
        case 'institution':
          return { ...current, institution: value };
        case 'bankBranch':
          return { ...current, bankBranch: value };
        case 'owner':
          return current;
      }
    });
  };
  const selectReviewOwner = (memberId: string) => {
    setF(current => ({ ...current, memberId, ownerName: '' }));
  };
  const enterDetailsManually = () => {
    setF({ ...emptyState, kind: initialDocumentDraft?.kind ?? initialKind });
    setNote('Original document attached. Enter the details manually.');
    setError(undefined);
    setReviewStep(false);
    setConfirmStep(false);
  };
  const nomineeInformation: NomineeInformation = {
    name: f.nomineeName,
    relationship: f.nomineeRelationship,
    phone: f.nomineePhone,
    allocation: f.nomineeAllocation,
    registrationStatus: f.nomineeRegistrationStatus,
  };
  const saveNomineeInformation = (nominee: NomineeInformation) => {
    setF(current => ({
      ...current,
      nominee: true,
      nomineeName: nominee.name,
      nomineeRelationship: nominee.relationship,
      nomineePhone: nominee.phone,
      nomineeAllocation: nominee.allocation,
      nomineeRegistrationStatus: nominee.registrationStatus,
    }));
    setNomineeInformationVisible(false);
    setNomineeSavedVisible(true);
  };
  const familyAccessNote: FamilyAccessNote = {
    instructions: f.accessNote,
    contactPerson: f.accessContactName,
    contactNumber: f.accessContactPhone,
  };
  const saveFamilyAccessNote = (accessNote: FamilyAccessNote) => {
    setF(current => ({
      ...current,
      accessNote: accessNote.instructions,
      accessContactName: accessNote.contactPerson,
      accessContactPhone: accessNote.contactNumber,
    }));
    setFamilyAccessNoteVisible(false);
    setFamilyAccessNoteSavedVisible(true);
  };
  const missingExtractedDetails = [
    ...(!f.nomineeName.trim() || !f.nomineeRelationship.trim()
      ? ['nominee']
      : []),
    ...(!f.accessNote.trim() ? ['family access note'] : []),
  ];

  const attachDocument = (document: SavedWealthDocument) => {
    setAttached(current =>
      current.some(item => item.id === document.id)
        ? current
        : [...current, { id: document.id, title: document.title }],
    );
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
    setNote(
      filled
        ? 'Filled what the document states. Check and confirm.'
        : 'No extra details found. Fill in by hand.',
    );
  };

  const useVaultDocument = (document: DocumentRecord) => {
    attachDocument({
      id: document.id,
      title:
        document.displayName?.trim() ||
        document.title?.trim() ||
        document.originalName,
      analysis: analysisFromVaultDocument(document),
    });
    setVaultPickerVisible(false);
  };

  const save = async () => {
    const nextValidationErrors = validateWealthHolding(
      { ...f, type: resolvedType },
      Boolean(initialDocument),
    );
    setValidationErrors(nextValidationErrors);
    if (Object.keys(nextValidationErrors).length > 0) {
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      const payload = {
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
          accountName: f.name,
          ownerName: f.ownerName || ownerName,
          balanceAsOf: f.balanceAsOf,
          branchName: f.bankBranch,
          currency: f.currency,
          memberId: f.memberId,
          renewalDate: f.kind === 'cover' ? f.renewalDate : '',
          maturityDate: f.kind === 'asset' ? f.maturityDate : '',
          accessInstruction: f.accessNote,
          accessContactName: f.accessContactName,
          accessContactPhone: f.accessContactPhone,
          nominee: f.nominee ? f.nomineeName || 'Named' : '',
          nomineeName: f.nominee ? f.nomineeName : '',
          nomineeRelationship: f.nominee ? f.nomineeRelationship : '',
          nomineePhone: f.nominee ? f.nomineePhone : '',
          nomineeAllocation: f.nominee ? f.nomineeAllocation : '',
          nomineeRegistrationStatus: f.nominee
            ? f.nomineeRegistrationStatus
            : '',
          [valueKeyByKind[f.kind]]: f.value,
          amount: f.value,
          categoryCode:
            f.kind === 'liability'
              ? 'loan'
              : f.kind === 'cover'
                ? 'insurance'
                : 'asset',
        },
        notes: f.accessNote,
        followUpDate: null,
        followUpNote: '',
        attachmentDocumentIds: [
          ...new Set([
            ...(initialRecord?.attachmentDocumentIds ??
              initialRecord?.attachments.map(item => item.documentId) ??
              []),
            ...attached.map(document => document.id),
          ]),
        ],
      };
      const record = initialRecord
        ? await wealthApi.updateRecord(initialRecord.id, payload)
        : await wealthApi.createRecord(payload);
      onCreated(record);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to add holding.',
      );
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = (invalid = false) => [
    styles.input,
    {
      backgroundColor: theme.colors.surface.raised,
      borderColor: invalid
        ? theme.colors.status.danger.border
        : theme.colors.border.default,
      color: theme.colors.text.primary,
    },
  ];
  const select = (text: string, onPress: () => void, invalid = false) => (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.select,
        {
          backgroundColor: theme.colors.surface.raised,
          borderColor: invalid
            ? theme.colors.status.danger.border
            : theme.colors.border.default,
        },
      ]}
    >
      <AppText variant="body" style={styles.selectText} numberOfLines={1}>
        {text}
      </AppText>
      <ChevronDown size={sizes.icon.md} color={theme.colors.text.primary} />
    </Pressable>
  );
  const field = (
    label: string,
    child: React.ReactNode,
    flex = false,
    fieldError?: string,
  ) => (
    <View style={[styles.field, flex && styles.flex]}>
      <AppText variant="body" style={styles.label}>
        {label}
      </AppText>
      {child}
      {fieldError ? (
        <AppText
          variant="caption"
          style={{ color: theme.colors.status.danger.text }}
          accessibilityRole="alert"
        >
          {fieldError}
        </AppText>
      ) : null}
    </View>
  );
  const text = (
    key:
      | 'name'
      | 'otherType'
      | 'institution'
      | 'balanceAsOf'
      | 'bankBranch'
      | 'accountRef'
      | 'value'
      | 'renewalDate'
      | 'maturityDate'
      | 'accessNote'
      | 'nomineeName',
    placeholder: string,
    extra: Pick<
      TextInputProps,
      'multiline' | 'keyboardType' | 'maxLength' | 'style'
    > = {},
  ) => (
    <TextInput
      value={f[key]}
      onChangeText={value => set(key, value)}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.text.tertiary}
      style={inputStyle(isValidationKey(key) && Boolean(validationErrors[key]))}
      {...extra}
    />
  );
  const dateText = (key: 'renewalDate' | 'maturityDate') => (
    <DatePickerInput
      value={f[key]}
      onChangeText={value => set(key, value)}
      placeholder="YYYY-MM-DD"
      style={inputStyle(Boolean(validationErrors[key]))}
    />
  );
  const isLiability = f.kind === 'liability';

  const pickerOptions = (() => {
    switch (picker) {
      case 'kind':
        return kinds.map(item => ({
          label: item.label,
          selected: f.kind === item.value,
          onPress: () => {
            setF(c => ({ ...c, kind: item.value, type: '', otherType: '' }));
            setPicker(null);
          },
        }));
      case 'type':
        return typeSuggestions[f.kind].map(item => ({
          label: item,
          selected: f.type === item,
          onPress: () => {
            set('type', item);
            setPicker(null);
          },
        }));
      case 'currency':
        return currencies.map(item => ({
          label: item,
          selected: f.currency === item,
          onPress: () => {
            set('currency', item);
            setPicker(null);
          },
        }));
      case 'owner':
        return owners.map(item => ({
          label: item.name,
          selected: f.memberId === item.id,
          onPress: () => {
            set('memberId', item.id);
            setPicker(null);
          },
        }));
      case 'source':
        return [
          {
            label: 'Choose from your vault',
            icon: FileText,
            onPress: () => {
              setPicker(null);
              setVaultPickerVisible(true);
            },
          },
          {
            label: 'Upload another document',
            icon: FileText,
            onPress: () => {
              setPicker(null);
              setDocumentUploadVisible(true);
            },
          },
        ];
      default:
        return [];
    }
  })();
  const pickerTitle = {
    kind: 'Choose kind',
    type: 'Choose type',
    currency: 'Choose currency',
    owner: 'Choose owner',
    source: 'Add document',
  }[picker ?? 'kind'];

  return (
    <>
      <Modal
        visible={!reviewStep && !confirmStep}
        transparent={!reviewStep && !confirmStep}
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={[
            styles.backdrop,
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
              styles.panel,
              {
                backgroundColor: theme.colors.surface.default,
                borderColor: theme.colors.border.default,
                paddingBottom: Math.max(24, insets.bottom + 8),
              },
            ]}
          >
            <Row align="center" justify="space-between">
              <AppText variant="heading" style={styles.title}>
                {initialDocument
                  ? 'Add account'
                  : initialRecord
                    ? 'Update holding'
                    : 'Add holding'}
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
              contentContainerStyle={styles.content}
            >
              {Object.keys(validationErrors).length > 0 ? (
                <View
                  accessibilityRole="alert"
                  style={[
                    styles.validationSummary,
                    { backgroundColor: theme.colors.status.danger.surface },
                  ]}
                >
                  <AppText
                    variant="label"
                    style={{ color: theme.colors.status.danger.text }}
                  >
                    Check {Object.keys(validationErrors).length} field
                    {Object.keys(validationErrors).length === 1 ? '' : 's'} to
                    continue
                  </AppText>
                  <AppText variant="bodySm">
                    Your details are kept here. Fix the highlighted fields and
                    save again.
                  </AppText>
                </View>
              ) : null}
              <View
                style={[
                  styles.banner,
                  {
                    backgroundColor: theme.colors.surface.raised,
                    borderColor: theme.colors.border.default,
                  },
                ]}
              >
                <FileText
                  size={sizes.icon.md}
                  color={theme.colors.text.secondary}
                />
                <AppText
                  variant="caption"
                  color="secondary"
                  style={styles.flex}
                >
                  {attached.length
                    ? (note ??
                      `${attached.length} supporting document${attached.length === 1 ? '' : 's'} linked.`)
                    : initialRecord?.attachments.length
                      ? `${initialRecord.attachments.length} supporting document${initialRecord.attachments.length === 1 ? '' : 's'} linked.`
                      : 'Add a document now, or save this holding and attach one later.'}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPicker('source')}
                >
                  <AppText
                    variant="label"
                    style={{ color: theme.colors.text.interactive }}
                  >
                    {attached.length || initialRecord?.attachments.length
                      ? 'Add another'
                      : 'Add document'}
                  </AppText>
                </Pressable>
              </View>

              {field(
                initialDocument ? 'Account name *' : 'Name',
                text(
                  'name',
                  initialDocument
                    ? 'Enter an account name'
                    : 'e.g. Investment portfolio',
                  { maxLength: 160 },
                ),
                false,
                validationErrors.name,
              )}
              <Row gap="md">
                {field(
                  'Kind',
                  select(
                    kinds.find(item => item.value === f.kind)?.label ?? '',
                    () => setPicker('kind'),
                  ),
                  true,
                )}
                {field(
                  'Type',
                  select(
                    f.type || 'Select type',
                    () => setPicker('type'),
                    Boolean(validationErrors.type),
                  ),
                  true,
                  validationErrors.type && f.type !== 'Other'
                    ? validationErrors.type
                    : undefined,
                )}
              </Row>
              {f.type === 'Other'
                ? field(
                    'Other type',
                    text('otherType', 'Enter type'),
                    false,
                    validationErrors.type,
                  )
                : null}
              <Row gap="md">
                {field(
                  initialDocument ? 'Bank *' : 'Institution',
                  text(
                    'institution',
                    initialDocument ? 'Enter bank name' : 'Bank / insurer',
                  ),
                  true,
                  validationErrors.institution,
                )}
                {field(
                  initialDocument ? 'Account reference *' : 'Account',
                  text(
                    'accountRef',
                    initialDocument ? 'Enter account reference' : '...4821',
                  ),
                  true,
                  validationErrors.accountRef,
                )}
              </Row>
              {initialDocument ? (
                <Row gap="md">
                  {field(
                    'Balance as of *',
                    text('balanceAsOf', '10 Nov 2026'),
                    true,
                    validationErrors.balanceAsOf,
                  )}
                  {field(
                    'Branch *',
                    text('bankBranch', 'Enter branch'),
                    true,
                    validationErrors.bankBranch,
                  )}
                </Row>
              ) : null}
              <Row gap="md">
                {field(
                  initialDocument && f.kind === 'asset'
                    ? 'Balance *'
                    : `${valueLabelByKind[f.kind]} *`,
                  text('value', '0', { keyboardType: 'numeric' }),
                  true,
                  validationErrors.value,
                )}
                {field(
                  'Currency',
                  select(f.currency, () => setPicker('currency')),
                  true,
                )}
              </Row>
              {field(
                initialDocument ? 'Owner *' : 'Owner',
                select(ownerName, () => setPicker('owner')),
              )}
              {f.kind === 'cover'
                ? field(
                    'Renewal date',
                    dateText('renewalDate'),
                    false,
                    validationErrors.renewalDate,
                  )
                : null}
              {f.kind === 'asset'
                ? field(
                    'Maturity date (deposits, retirement)',
                    dateText('maturityDate'),
                    false,
                    validationErrors.maturityDate,
                  )
                : null}
              {field(
                isLiability
                  ? 'Closure instructions for the family'
                  : 'Access instructions for the family',
                text(
                  'accessNote',
                  isLiability
                    ? 'Who to contact, account details, and how to close or take over the loan'
                    : 'Where it is, who to contact, how to claim (locker no., agent, portal)',
                  {
                    multiline: true,
                    style: [inputStyle(), styles.textarea],
                  },
                ),
              )}
              {!isLiability ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Nominee information"
                  onPress={() => setNomineeInformationVisible(true)}
                  style={[
                    styles.banner,
                    {
                      backgroundColor: theme.colors.surface.raised,
                      borderColor: theme.colors.border.default,
                    },
                  ]}
                >
                  <ContactRound
                    size={sizes.icon.md}
                    color={theme.colors.text.interactive}
                  />
                  <View style={styles.flex}>
                    <AppText variant="label">
                      {f.nomineeName.trim() || 'Nominee information'}
                    </AppText>
                    <AppText variant="caption" color="secondary">
                      {f.nomineeName.trim()
                        ? `${f.nomineeRelationship} · ${f.nomineeAllocation}% allocation`
                        : 'Add or update the nominee for this holding'}
                    </AppText>
                  </View>
                  <AppText
                    variant="label"
                    style={{ color: theme.colors.text.interactive }}
                  >
                    {f.nomineeName.trim() ? 'Edit' : 'Add'}
                  </AppText>
                </Pressable>
              ) : null}

              {error ? (
                <AppText variant="caption" color="danger">
                  {error}
                </AppText>
              ) : null}
              <Pressable
                accessibilityRole="button"
                disabled={saving}
                onPress={() => {
                  save();
                }}
                style={[
                  styles.submit,
                  {
                    backgroundColor: theme.colors.action.primary.default,
                    opacity: saving ? 0.5 : 1,
                  },
                ]}
              >
                <AppText
                  variant="heading"
                  style={{ color: theme.colors.text.onBrand }}
                >
                  {saving
                    ? 'Saving…'
                    : initialDocument
                      ? 'Save entry'
                      : initialRecord
                        ? 'Save changes'
                        : 'Add holding'}
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
      {initialDocument ? (
        <WealthExtractedDetailsReview
          visible={reviewStep && !confirmStep}
          document={initialDocument}
          values={reviewValues}
          owners={owners}
          selectedOwnerId={f.memberId}
          userName={userName}
          onChange={updateReviewField}
          onOwnerChange={selectReviewOwner}
          onClose={onClose}
          onContinue={() => {
            setError(undefined);
            setReviewStep(false);
            setConfirmStep(true);
          }}
          onEnterManually={enterDetailsManually}
        />
      ) : null}
      {initialDocument ? (
        <WealthExtractedEntryConfirmation
          visible={confirmStep}
          documentTitle={initialDocument.title}
          values={reviewValues}
          currency={f.currency}
          ownerName={ownerName}
          userName={userName}
          missingDetails={missingExtractedDetails}
          saving={saving}
          error={error}
          onConfirm={save}
          onBackToReview={() => {
            setError(undefined);
            setConfirmStep(false);
            setReviewStep(true);
          }}
          onAddNominee={
            !isLiability ? () => setNomineeInformationVisible(true) : undefined
          }
        />
      ) : null}
      {!isLiability ? (
        <NomineeInformationScreen
          visible={nomineeInformationVisible}
          holdingName={f.name || 'This holding'}
          accountReference={f.accountRef}
          initialValue={nomineeInformation}
          userName={userName}
          onClose={() => setNomineeInformationVisible(false)}
          onSave={saveNomineeInformation}
        />
      ) : null}
      {!isLiability ? (
        <NomineeSavedScreen
          visible={nomineeSavedVisible}
          nominee={nomineeInformation}
          holdingName={f.name || 'This holding'}
          accountReference={f.accountRef}
          institution={f.institution}
          accessNote={f.accessNote}
          accessContactName={f.accessContactName}
          accessContactPhone={f.accessContactPhone}
          userName={userName}
          onAddAccessNote={() => {
            setNomineeSavedVisible(false);
            setFamilyAccessNoteVisible(true);
          }}
          onBackToHolding={() => setNomineeSavedVisible(false)}
        />
      ) : null}
      {!isLiability ? (
        <FamilyAccessNoteScreen
          visible={familyAccessNoteVisible}
          holdingName={f.name || 'This holding'}
          accountReference={f.accountRef}
          userName={userName}
          initialValue={familyAccessNote}
          onClose={() => {
            setFamilyAccessNoteVisible(false);
            setNomineeSavedVisible(true);
          }}
          onSave={saveFamilyAccessNote}
        />
      ) : null}
      {!isLiability ? (
        <FamilyAccessNoteSavedScreen
          visible={familyAccessNoteSavedVisible}
          holdingName={f.name || 'This holding'}
          userName={userName}
          onViewHolding={() => setFamilyAccessNoteSavedVisible(false)}
          onBackToWealth={() => {
            setFamilyAccessNoteSavedVisible(false);
            save();
          }}
        />
      ) : null}
      <>
        <WealthDocumentPicker
          visible={vaultPickerVisible}
          onClose={() => setVaultPickerVisible(false)}
          onExtract={useVaultDocument}
          onUploadAnother={() => {
            setVaultPickerVisible(false);
            setDocumentUploadVisible(true);
          }}
        />
        <WealthDocumentUploadScreen
          visible={documentUploadVisible}
          userName={userName}
          onClose={() => setDocumentUploadVisible(false)}
          onUploaded={attachDocument}
        />
      </>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
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
  title: {
    fontSize: fontSize.headingMd,
    lineHeight: lineHeight.headingMd,
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
  content: { gap: 12, paddingBottom: 8 },
  validationSummary: {
    borderRadius: radius.surface,
    padding: 12,
    gap: 4,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  textarea: { minHeight: 90, paddingTop: 12, textAlignVertical: 'top' },
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
  submit: {
    minHeight: 52,
    borderRadius: radius.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
});
