import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  Building2,
  ChevronRight,
  CircleDollarSign,
  HandCoins,
  KeyRound,
  Landmark,
  Plus,
  Search,
  ShieldCheck,
  Siren,
  Trash2,
} from 'lucide-react-native';

import { useAppTheme } from '../../design/theme/ThemeProvider';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { Row } from '../../components/primitives/Row';
import { AppText } from '../../components/primitives/AppText';
import { Card } from '../../components/primitives/Card';
import { Button } from '../../components/primitives/Button';
import { FloatingActionButton } from '../../components/primitives/FloatingActionButton';
import { WealthAddSheet, LentBorrowedForm } from './WealthAddSheet';
import { documentsApi } from '../../api/documents.api';
import {
  analyzeSelectedDocument,
  captureDocumentPhoto,
  discardSelectedDocument,
  selectDocumentFile,
  selectImageFromGallery,
  type SelectedDocument,
} from '../documents/documentImport';
import {
  wealthApi,
  type DynamicFormCategory,
  type DynamicFormField,
  type DynamicFormSchema,
  type WealthHandoffSummary,
  type WealthRecord,
} from '../../api/wealth.api';


type LendingItem = {
  id: string;
  name: string;
  description: string;
  amount: number;
  direction: 'owedToYou' | 'youOwe';
  status: 'open' | 'settled';
  followUp: string;
};

const categories = [
  'All',
  'Accounts and investments',
  'Loans',
  'Insurance',
  'Lent and borrowed',
];

function formatMoney(value: number) {
  const amount = Math.abs(value);

  if (amount >= 10_000_000) {
    return `₹${(value / 10_000_000).toFixed(
      amount % 10_000_000 === 0 ? 0 : 1,
    )}Cr`;
  }

  if (amount >= 100_000) {
    return `₹${(value / 100_000).toFixed(
      amount % 100_000 === 0 ? 0 : 1,
    )}L`;
  }

  if (amount >= 1_000) {
    return `₹${Math.round(value / 1_000)}K`;
  }

  return `₹${value.toLocaleString('en-IN')}`;
}

function recordAmount(record: WealthRecord) {
  const details = record.details;
  const amount =
    details.outstanding ??
    details.amount ??
    details.principal ??
    details.value ??
    0;
  const parsed = typeof amount === 'number' ? amount : Number(amount);
  return Number.isFinite(parsed) ? parsed : 0;
}

function recordCounterparty(record: WealthRecord) {
  const details = record.details;
  return String(
    details.counterparty ?? details.borrower ?? details.lender ?? record.title,
  );
}

function toLendingItem(record: WealthRecord): LendingItem {
  return {
    id: record.id,
    name: recordCounterparty(record),
    description: record.notes || record.title,
    amount: recordAmount(record),
    direction: record.type === 'LOAN_GIVEN' ? 'owedToYou' : 'youOwe',
    status: detailsAreSettled(record) ? 'settled' : 'open',
    followUp: record.followUpDate
      ? `follow up ${new Date(record.followUpDate).toLocaleDateString()}`
      : 'no follow-up date',
  };
}

function detailsAreSettled(record: WealthRecord) {
  return record.details.status === 'settled' || record.details.status === 'SETTLED';
}

function Header({
  onSearch,
}: {
  onSearch: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <Row align="center" justify="space-between">
      <AppText variant="title" style={styles.headerTitle}>
        Wealth
      </AppText>

      <Row gap="sm" align="center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search"
          onPress={onSearch}
          style={({ pressed }) => [
            styles.headerButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
            pressed && styles.pressed,
          ]}
        >
          <Search
            size={22}
            color={theme.colors.textSecondary}
            strokeWidth={2}
          />
        </Pressable>

        <View
          style={[
            styles.avatar,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <AppText variant="heading" color="secondary">
            A
          </AppText>
        </View>
      </Row>
    </Row>
  );
}

function ReadinessCard({
  records,
  lendingItems,
  onHandoff,
}: {
  records: WealthRecord[];
  lendingItems: LendingItem[];
  onHandoff: () => void;
}) {
  const { theme } = useAppTheme();

  const attachmentCount = records.filter(
    record => record.attachments.length > 0,
  ).length;

  const readiness = records.length
    ? Math.round((attachmentCount / records.length) * 100)
    : 0;

  const owedToYou = lendingItems
    .filter(item => item.direction === 'owedToYou')
    .reduce((total, item) => total + item.amount, 0);

  const youOwe = lendingItems
    .filter(item => item.direction === 'youOwe')
    .reduce((total, item) => total + item.amount, 0);

  return (
    <Card style={styles.readinessCard}>
      <Row
        align="center"
        justify="space-between"
        style={styles.readinessTopRow}
      >
        <Row
          align="center"
          gap="sm"
          style={styles.readinessTitleRow}
        >
          <KeyRound
            size={22}
            color={theme.colors.textSecondary}
            strokeWidth={2}
          />

          <AppText
            variant="heading"
            style={styles.readinessTitle}
          >
            Family access readiness
          </AppText>
        </Row>

        <AppText
          variant="display"
          color="success"
          style={styles.readinessPercentage}
        >
          {readiness}%
        </AppText>
      </Row>

      <View
        style={[
          styles.progressTrack,
          { backgroundColor: theme.colors.surfaceElevated },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${readiness}%`,
              backgroundColor: theme.colors.success,
            },
          ]}
        />
      </View>

      <Row
        align="center"
        justify="space-between"
        style={styles.readinessInfo}
      >
        <AppText
          variant="body"
          color="secondary"
          style={styles.readinessMeta}
        >
          {records.length
            ? `${attachmentCount} docs · ${Math.max(records.length - attachmentCount, 0)} access missing`
            : 'Add records to build family access readiness'}
        </AppText>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="How to improve family access readiness"
          onPress={onHandoff}
          style={({ pressed }) => [
            styles.howButton,
            {
              backgroundColor: theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
            },
            pressed && styles.pressed,
          ]}
        >
          <AppText variant="label">How?</AppText>
        </Pressable>
      </Row>

      <Row
        align="center"
        style={styles.debtSummary}
      >
        <CircleDollarSign
          size={20}
          color={theme.colors.textSecondary}
          strokeWidth={2}
        />

        <AppText variant="body" color="secondary">
          Owed to you
        </AppText>

        <AppText variant="body" style={styles.moneyText}>
          {formatMoney(owedToYou)}
        </AppText>

        <AppText variant="body" color="secondary">
          ·
        </AppText>

        <AppText variant="body" color="secondary">
          You owe
        </AppText>

        <AppText variant="body" style={styles.moneyText}>
          {formatMoney(youOwe)}
        </AppText>

        <ChevronRight
          size={18}
          color={theme.colors.textSecondary}
          strokeWidth={2}
        />
      </Row>
    </Card>
  );
}

function WealthGroupCard({
  title,
  records,
  total,
}: {
  title: string;
  records: WealthRecord[];
  total: number;
}) {
  const { theme } = useAppTheme();

  if (!records.length) {
    return null;
  }

  return (
    <Card style={styles.groupCard}>
      <Row
        align="center"
        justify="space-between"
        style={styles.groupHeader}
      >
        <AppText variant="heading" style={styles.groupTitle}>
          {title}
        </AppText>

        <AppText
          variant="heading"
          color="secondary"
          style={styles.groupTotal}
        >
          {formatMoney(total)}
        </AppText>
      </Row>

      <View
        style={[
          styles.sectionDivider,
          { backgroundColor: theme.colors.border },
        ]}
      />

      {records.map((record, index) => (
        <WealthRecordRow
          key={record.id}
          record={record}
          last={index === records.length - 1}
        />
      ))}
    </Card>
  );
}

function WealthRecordRow({
  record,
  last,
}: {
  record: WealthRecord;
  last: boolean;
}) {
  const { theme } = useAppTheme();
  const details = record.details;
  const amount = recordAmount(record);

  const isLoan =
    record.type === 'LOAN_GIVEN' ||
    record.type === 'LOAN_TAKEN';

  const isInsurance = record.type === 'INSURANCE';

  const Icon = isLoan
    ? Landmark
    : isInsurance
      ? ShieldCheck
      : Building2;

  const iconColor = isLoan
    ? theme.colors.danger
    : isInsurance
      ? theme.colors.primary
      : theme.colors.warning;

  const iconBackground = isLoan
    ? `${theme.colors.danger}20`
    : isInsurance
      ? `${theme.colors.primary}20`
      : `${theme.colors.warning}20`;

  const institution = String(
    details.institution ??
      details.bank ??
      details.provider ??
      details.company ??
      '',
  );

  const accountNumber = String(
    details.accountNumber ??
      details.account ??
      details.policyNumber ??
      details.number ??
      '',
  );

  const originalAmount =
    details.originalAmount ??
    details.principal ??
    details.value ??
    '';

  const metaLabel =
    record.type === 'ASSET'
      ? 'Bank account'
      : record.type === 'INSURANCE'
        ? 'Insurance'
        : 'Mortgage';

  return (
    <View
      style={[
        styles.wealthRow,
        !last && {
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.wealthIcon,
          { backgroundColor: iconBackground },
        ]}
      >
        <Icon
          size={25}
          color={iconColor}
          strokeWidth={2}
        />
      </View>

      <View style={styles.wealthCopy}>
        <AppText
          variant="heading"
          style={styles.wealthName}
          numberOfLines={2}
        >
          {record.title}
        </AppText>

        <AppText
          variant="body"
          color="secondary"
          style={styles.wealthMeta}
          numberOfLines={2}
        >
          {metaLabel}{institution ? ` · ${institution}` : ''}
        </AppText>

        {(accountNumber || originalAmount) ? (
          <AppText
            variant="body"
            color="secondary"
            style={styles.wealthSecondary}
            numberOfLines={2}
          >
            {accountNumber ? `·${accountNumber}` : ''}
            {originalAmount !== ''
              ? ` · ${formatMoney(Number(originalAmount))} at 95.40`
              : ''}
          </AppText>
        ) : null}

        {record.notes ? (
          <AppText
            variant="body"
            color="danger"
            style={styles.wealthWarning}
          >
            {record.notes}
          </AppText>
        ) : null}
      </View>

      <AppText
        variant="heading"
        color={record.type === 'LOAN_TAKEN' ? 'danger' : 'primary'}
        style={styles.wealthAmount}
        numberOfLines={1}
      >
        {record.type === 'LOAN_TAKEN' ? '−' : ''}
        {formatMoney(amount)}
      </AppText>

      <ChevronRight
        size={22}
        color={theme.colors.textSecondary}
        strokeWidth={2}
      />
    </View>
  );
}

function CategoryTabs({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (value: string) => void;
}) {
  const { theme } = useAppTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryContent}
    >
      {categories.map(category => {
        const isSelected = category === selected;

        return (
          <Pressable
            key={category}
            onPress={() => onSelect(category)}
            style={({ pressed }) => [
              styles.categoryPill,
              {
                borderColor: isSelected
                  ? theme.colors.primary
                  : theme.colors.border,
                backgroundColor: isSelected
                  ? theme.colors.surfaceElevated
                  : 'transparent',
              },
              pressed && styles.pressed,
            ]}
          >
            <AppText
              variant="label"
              color={isSelected ? 'primary' : 'secondary'}
              style={styles.categoryText}
            >
              {category}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function LendingSection({
  items,
  onAdd,
  onDelete,
}: {
  items: LendingItem[];
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const { theme } = useAppTheme();

  const openCount = items.filter(
    item => item.status === 'open',
  ).length;

  return (
    <Card style={styles.lendingCard}>
      <Row
        align="center"
        justify="space-between"
        style={styles.lendingHeader}
      >
        <Row
          align="center"
          gap="sm"
          style={styles.lendingTitleRow}
        >
          <HandCoins
            size={21}
            color={theme.colors.textSecondary}
            strokeWidth={2}
          />

          <AppText
            variant="heading"
            style={styles.lendingTitle}
          >
            Lent and borrowed
          </AppText>

          <View
            style={[
              styles.openBadge,
              {
                backgroundColor:
                  theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <AppText variant="label" color="secondary">
              {openCount} open
            </AppText>
          </View>
        </Row>

        <Pressable
          onPress={onAdd}
          style={({ pressed }) => [
            styles.recordButton,
            {
              backgroundColor:
                theme.colors.surfaceElevated,
              borderColor: theme.colors.border,
            },
            pressed && styles.pressed,
          ]}
        >
          <Plus
            size={19}
            color={theme.colors.textPrimary}
            strokeWidth={2}
          />

          <AppText variant="label">
            Record
          </AppText>
        </Pressable>
      </Row>

      <View
        style={[
          styles.sectionDivider,
          {
            backgroundColor: theme.colors.border,
          },
        ]}
      />

      {items.map((item, index) => (
        <View
          key={item.id}
          style={[
            styles.lendingItem,
            index !== items.length - 1 && {
              borderBottomColor: theme.colors.border,
              borderBottomWidth: 1,
            },
          ]}
        >
          <View
            style={[
              styles.lendingIcon,
              {
                backgroundColor:
                  theme.colors.surfaceElevated,
              },
            ]}
          >
            <CircleDollarSign
              size={23}
              color={
                item.direction === 'owedToYou'
                  ? theme.colors.success
                  : theme.colors.danger
              }
              strokeWidth={2}
            />
          </View>

          <View style={styles.lendingMain}>
            <AppText
              variant="heading"
              style={styles.lendingName}
            >
              {item.name}
            </AppText>

            <AppText
              variant="body"
              color="secondary"
              style={styles.lendingDescription}
            >
              {item.description} · {item.followUp}
            </AppText>
          </View>

          <View style={styles.amountColumn}>
            <AppText
              variant="heading"
              color={
                item.direction === 'owedToYou'
                  ? 'success'
                  : 'danger'
              }
              style={styles.amountText}
            >
              {formatMoney(item.amount)}
            </AppText>

            <AppText
              variant="label"
              color="secondary"
              style={styles.amountLabel}
            >
              {item.direction === 'owedToYou'
                ? 'owed to you'
                : 'you owe'}
            </AppText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete ${item.name}`}
            onPress={() => onDelete(item.id)}
            hitSlop={8}
          >
            <Trash2 size={18} color={theme.colors.danger} />
          </Pressable>
        </View>
      ))}
    </Card>
  );
}

export function WealthScreen({
  guestPreview = false,
  onSignIn,
}: {
  guestPreview?: boolean;
  onSignIn?: () => void;
}) {
  const { theme } = useAppTheme();
  const [records, setRecords] = useState<WealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [lentFormVisible, setLentFormVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [handoffVisible, setHandoffVisible] = useState(false);

  useEffect(() => {
    if (guestPreview) {
      setRecords([]);
      setLoading(false);
      setError(undefined);
      return;
    }

    let active = true;
    setLoading(true);
    setError(undefined);
    wealthApi.records()
      .then(items => {
        if (active) setRecords(items);
      })
      .catch(loadError => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load wealth records.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [guestPreview, reloadKey]);

  const lendingItems = records
    .filter(record => {
      const details = record.details;
      return (
        (record.type === 'LOAN_TAKEN' || record.type === 'LOAN_GIVEN') &&
        Boolean(
          details.counterparty ??
            details.borrower ??
            details.lender,
        )
      );
    })
    .map(toLendingItem);

  const filteredRecords = records.filter(record => {
    const query = searchQuery.trim().toLowerCase();

    const queryMatch =
      !query ||
      `${record.title} ${record.notes ?? ''} ${record.type}`
        .toLowerCase()
        .includes(query);

    if (!queryMatch) {
      return false;
    }

    const details = record.details;
    const isLending = Boolean(
      details.counterparty ??
        details.borrower ??
        details.lender,
    );

    switch (selectedCategory) {
      case 'Accounts and investments':
        return record.type === 'ASSET';

      case 'Loans':
        return (
          (record.type === 'LOAN_GIVEN' ||
            record.type === 'LOAN_TAKEN') &&
          !isLending
        );

      case 'Insurance':
        return record.type === 'INSURANCE';

      case 'Lent and borrowed':
        return isLending;

      case 'All':
      default:
        return !isLending || record.type === 'PAYMENT_PROOF';
    }
  });

  const investmentRecords = filteredRecords.filter(
    record => record.type === 'ASSET',
  );

  const loanRecords = filteredRecords.filter(
    record =>
      (record.type === 'LOAN_GIVEN' ||
        record.type === 'LOAN_TAKEN') &&
      !Boolean(
        record.details.counterparty ??
          record.details.borrower ??
          record.details.lender,
      ),
  );

  const insuranceRecords = filteredRecords.filter(
    record => record.type === 'INSURANCE',
  );

  const investmentTotal = investmentRecords.reduce(
    (total, record) => total + recordAmount(record),
    0,
  );

  const loanTotal = loanRecords.reduce(
    (total, record) => total + recordAmount(record),
    0,
  );

  const insuranceTotal = insuranceRecords.reduce(
    (total, record) => total + recordAmount(record),
    0,
  );
  const hasVisibleRecords = selectedCategory === 'All'
    ? investmentRecords.length + loanRecords.length + insuranceRecords.length + lendingItems.length > 0
    : filteredRecords.length > 0;

  const deleteRecord = (record: WealthRecord) =>
    Alert.alert(
      'Delete wealth record?',
      `Delete ${record.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            wealthApi
              .deleteRecord(record.id)
              .then(() =>
                setRecords(current =>
                  current.filter(item => item.id !== record.id),
                ),
              )
              .catch(deleteError =>
                setError(
                  deleteError instanceof Error
                    ? deleteError.message
                    : 'Unable to delete record.',
                ),
              );
          },
        },
      ],
    );

  const renderContent = () => {
    if (selectedCategory === 'All') {
      return (
        <>
          <WealthGroupCard
            title="Accounts and investments"
            records={investmentRecords}
            total={investmentTotal}
          />

          <WealthGroupCard
            title="Loans"
            records={loanRecords}
            total={loanTotal}
          />

          <WealthGroupCard
            title="Insurance"
            records={insuranceRecords}
            total={insuranceTotal}
          />

          <LendingSection
            items={lendingItems.filter(item =>
              records.some(record => record.id === item.id),
            )}
            onAdd={() => setLentFormVisible(true)}
            onDelete={id => {
              const record = records.find(
                item => item.id === id,
              );
              if (record) deleteRecord(record);
            }}
          />
        </>
      );
    }

    if (selectedCategory === 'Lent and borrowed') {
      return (
        <LendingSection
          items={lendingItems.filter(item =>
            filteredRecords.some(record => record.id === item.id),
          )}
          onAdd={() => setLentFormVisible(true)}
          onDelete={id => {
            const record = records.find(
              item => item.id === id,
            );
            if (record) deleteRecord(record);
          }}
        />
      );
    }

    if (selectedCategory === 'Accounts and investments') {
      return (
        <WealthGroupCard
          title="Accounts and investments"
          records={investmentRecords}
          total={investmentTotal}
        />
      );
    }

    if (selectedCategory === 'Loans') {
      return (
        <WealthGroupCard
          title="Loans"
          records={loanRecords}
          total={loanTotal}
        />
      );
    }

    return (
      <WealthGroupCard
        title="Insurance"
        records={insuranceRecords}
        total={insuranceTotal}
      />
    );
  };

  const importAsRecord = async (selected: SelectedDocument, aiConsent: boolean) => {
    setImporting(true);
    try {
      const analysis = await analyzeSelectedDocument(selected, aiConsent);
      const doc = analysis.document;
      const saved = await documentsApi.save({
        tempFileIds: analysis.files.map(file => file.tempFileId),
        title: doc.title,
        category: doc.category,
        documentType: doc.documentType,
        confidence: doc.confidence,
        fields: doc.fields ?? {},
        reviewFields: doc.reviewFields ?? [],
        rawExtractedText: doc.rawExtractedText ?? '',
        warnings: analysis.warnings ?? [],
        evidence: doc.evidence ?? [],
        analysisSource: aiConsent ? 'ai' : 'rules',
        duplicateAction: 'keep_both',
        owner: 'self',
        userConfirmedUnknown: true,
        verified: false,
      });
      const kind = `${doc.category} ${doc.documentType}`.toLowerCase();
      const type = /insurance|policy|cover/.test(kind)
        ? 'INSURANCE'
        : /loan|mortgage|liability|credit/.test(kind)
          ? 'LOAN_TAKEN'
          : 'ASSET';
      const record = await wealthApi.createRecord({
        type,
        title: saved.document.displayName ?? saved.document.title ?? doc.title,
        details: {
          sourceDocumentId: saved.document.id,
          sourceDocumentCategory: doc.category,
          sourceDocumentType: doc.documentType,
          currency: 'INR',
        },
        attachmentDocumentIds: [saved.document.id],
      });
      setRecords(current => [record, ...current]);
      Alert.alert('Added to Wealth', `${record.title} was created from your document. You can edit its details later.`);
    } catch (importError) {
      Alert.alert(
        'Unable to add from document',
        importError instanceof Error ? importError.message : 'Please try again.',
      );
    } finally {
      setImporting(false);
    }
  };

  const startDocumentRecord = async (
    select: () => Promise<SelectedDocument | undefined>,
  ) => {
    try {
      const selected = await select();
      if (!selected) return;
      Alert.alert(
        'Analyze document?',
        'The file is encrypted on this device before upload. Choose whether to allow AI analysis.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => discardSelectedDocument(selected) },
          { text: 'Rules only', onPress: () => importAsRecord(selected, false) },
          { text: 'Allow AI', onPress: () => importAsRecord(selected, true) },
        ],
        { cancelable: false },
      );
    } catch (selectionError) {
      Alert.alert(
        'Unable to select document',
        selectionError instanceof Error ? selectionError.message : 'Please try again.',
      );
    }
  };

  const chooseDocumentSource = () => {
    setAddSheetVisible(false);
    Alert.alert('From a document', 'Choose where the document comes from.', [
      { text: 'Choose file', onPress: () => startDocumentRecord(selectDocumentFile) },
      { text: 'Photo library', onPress: () => startDocumentRecord(selectImageFromGallery) },
      { text: 'Camera', onPress: () => startDocumentRecord(captureDocumentPhoto) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Screen
      scroll
      padded={false}
      contentContainerStyle={styles.screenContent}
      floatingAction={
        guestPreview ? null : (
          <FloatingActionButton
            accessibilityLabel="Add wealth record"
            onPress={() => setAddSheetVisible(true)}
          />
        )
      }
    >
      <Stack
        gap="md"
        style={[
          styles.container,
          {
            paddingTop: theme.spacing.sm,
            paddingBottom: theme.spacing.xl,
          },
        ]}
      >
        <Header
          onSearch={() =>
            setSearchVisible(value => !value)
          }
        />

        {guestPreview ? (
          <Row
            align="center"
            justify="space-between"
            style={[
              styles.guestNotice,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <AppText variant="caption" color="secondary">
              Guest preview · your data stays private
            </AppText>
            <Pressable accessibilityRole="button" onPress={onSignIn}>
              <AppText variant="label" color="primary">Sign in</AppText>
            </Pressable>
          </Row>
        ) : null}

        {searchVisible ? (
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Search
              size={19}
              color={theme.colors.textSecondary}
              strokeWidth={2}
            />

            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search investments, loans, insurance..."
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.searchPlaceholder,
                { color: theme.colors.textPrimary },
              ]}
            />
          </View>
        ) : null}

        {error ? (
          <Row align="center" gap="sm">
            <AppText
              variant="caption"
              color="danger"
              style={styles.errorText}
            >
              {error}
            </AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => setReloadKey(value => value + 1)}
            >
              <AppText variant="label" color="primary">Retry</AppText>
            </Pressable>
          </Row>
        ) : null}

        {loading ? (
          <AppText variant="caption" color="secondary">
            Loading wealth records…
          </AppText>
        ) : null}

        <ReadinessCard
          records={records}
          lendingItems={lendingItems}
          onHandoff={() => guestPreview ? onSignIn?.() : setHandoffVisible(true)}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="SOS handoff"
          onPress={() => guestPreview ? onSignIn?.() : setHandoffVisible(true)}
          style={({ pressed }) => [
            styles.sosButton,
            { backgroundColor: theme.colors.danger },
            pressed && styles.pressed,
          ]}
        >
          <Siren
            size={24}
            color="#111111"
            strokeWidth={2}
          />

          <AppText
            variant="heading"
            style={styles.sosText}
          >
            SOS handoff
          </AppText>
        </Pressable>

        <CategoryTabs
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {!loading && !error && !hasVisibleRecords ? (
          <Card style={styles.emptyState}>
            <CircleDollarSign
              size={34}
              color={theme.colors.primary}
              strokeWidth={1.8}
            />
            <AppText variant="heading" style={styles.emptyTitle}>
              {records.length ? `No ${selectedCategory.toLowerCase()} yet` : 'No wealth records yet'}
            </AppText>
            <AppText
              variant="body"
              color="secondary"
              style={styles.emptyCopy}
            >
              {guestPreview
                ? 'Sign in to securely add and manage accounts, loans, and insurance.'
                : 'Keep accounts, investments, loans, and insurance together in one place.'}
            </AppText>
            <Button
              title={guestPreview ? 'Sign in to continue' : 'Add first record'}
              onPress={guestPreview ? onSignIn ?? (() => {}) : () => setFormVisible(true)}
            />
          </Card>
        ) : null}

        {hasVisibleRecords ? renderContent() : null}

        <WealthAddSheet
          visible={addSheetVisible}
          onClose={() => setAddSheetVisible(false)}
          onFromDocument={chooseDocumentSource}
          onManual={() => {
            setAddSheetVisible(false);
            setFormVisible(true);
          }}
          onLentBorrowed={() => {
            setAddSheetVisible(false);
            setLentFormVisible(true);
          }}
        />
        {importing ? (
          <AppText variant="caption" color="secondary">
            Adding record from document…
          </AppText>
        ) : null}
        {lentFormVisible ? (
          <LentBorrowedForm
            onClose={() => setLentFormVisible(false)}
            onCreated={record => {
              setRecords(current => [record, ...current]);
              setLentFormVisible(false);
            }}
          />
        ) : null}
        {formVisible ? (
          <WealthRecordForm
            onClose={() => setFormVisible(false)}
            onCreated={record => {
              setRecords(current => [record, ...current]);
              setFormVisible(false);
            }}
          />
        ) : null}

        {handoffVisible ? (
          <WealthHandoffModal
            onClose={() => setHandoffVisible(false)}
          />
        ) : null}
      </Stack>
    </Screen>
  );
}

function WealthRecordForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (record: WealthRecord) => void;
}) {
  const { theme } = useAppTheme();
  const [formCategories, setFormCategories] = useState<DynamicFormCategory[]>([]);
  const [subtypes, setSubtypes] = useState<DynamicFormCategory[]>([]);
  const [schema, setSchema] = useState<DynamicFormSchema>();
  const [categoryCode, setCategoryCode] = useState('');
  const [subtypeCode, setSubtypeCode] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    wealthApi.formCategories()
      .then(items => {
        if (!active) return;
        setFormCategories(items);
        setCategoryCode(items[0]?.code ?? '');
      })
      .catch(loadError => setError(loadError instanceof Error ? loadError.message : 'Unable to load wealth forms.'));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!categoryCode) return;
    let active = true;
    setSubtypeCode('');
    setSchema(undefined);
    wealthApi.formSubtypes(categoryCode)
      .then(items => {
        if (!active) return;
        setSubtypes(items);
        setSubtypeCode(items[0]?.code ?? '');
      })
      .catch(loadError => setError(loadError instanceof Error ? loadError.message : 'Unable to load record types.'));
    return () => { active = false; };
  }, [categoryCode]);

  useEffect(() => {
    if (!categoryCode || !subtypeCode) return;
    let active = true;
    setLoading(true);
    wealthApi.formSchema(categoryCode, subtypeCode)
      .then(formSchema => {
        if (!active) return;
        setSchema(formSchema);
        setValues(Object.fromEntries(
          formSchema.fields.map(field => [field.id, String(field.defaultValue ?? '')]),
        ));
      })
      .catch(loadError => setError(loadError instanceof Error ? loadError.message : 'Unable to load record fields.'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [categoryCode, subtypeCode]);

  const save = async () => {
    if (!schema || schema.fields.some(field => field.required && !values[field.id]?.trim())) {
      setError('Complete all required fields.');
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      const record = await wealthApi.createRecordFromForm({
        categoryCode,
        subtypeCode,
        values,
      });
      onCreated(record);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save wealth record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalPanel, { backgroundColor: theme.colors.background }]}>
          <Row align="center" justify="space-between">
            <AppText variant="heading">Add wealth record</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose}>
              <AppText variant="label" color="secondary">Close</AppText>
            </Pressable>
          </Row>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formContent}>
            <AppText variant="caption" color="secondary">Category</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Row gap="xs">
                {formCategories.map(category => (
                  <Pressable
                    key={category.code}
                    onPress={() => setCategoryCode(category.code)}
                    style={[styles.formChoice, {
                      borderColor: categoryCode === category.code ? theme.colors.primary : theme.colors.border,
                    }]}
                  >
                    <AppText variant="caption">{category.label}</AppText>
                  </Pressable>
                ))}
              </Row>
            </ScrollView>
            <AppText variant="caption" color="secondary">Record type</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Row gap="xs">
                {subtypes.map(subtype => (
                  <Pressable
                    key={subtype.code}
                    onPress={() => setSubtypeCode(subtype.code)}
                    style={[styles.formChoice, {
                      borderColor: subtypeCode === subtype.code ? theme.colors.primary : theme.colors.border,
                    }]}
                  >
                    <AppText variant="caption">{subtype.label}</AppText>
                  </Pressable>
                ))}
              </Row>
            </ScrollView>
            {loading ? <AppText variant="caption" color="secondary">Loading fields…</AppText> : null}
            {schema?.fields.map((field: DynamicFormField) => (
              <Stack key={field.id} gap="xs">
                <AppText variant="caption" color="secondary">
                  {field.label}{field.required ? ' *' : ''}
                </AppText>
                <TextInput
                  value={values[field.id] ?? ''}
                  onChangeText={value => setValues(current => ({ ...current, [field.id]: value }))}
                  placeholder={field.placeholder ?? ''}
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType={field.inputType === 'number' ? 'numeric' : 'default'}
                  multiline={field.inputType === 'textarea'}
                  style={[styles.formInput, {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary,
                  }]}
                />
              </Stack>
            ))}
            {error ? <AppText variant="caption" color="danger">{error}</AppText> : null}
            <Button title={saving ? 'Saving…' : 'Save record'} disabled={saving || loading || !schema} onPress={() => { save(); }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function WealthHandoffModal({ onClose }: { onClose: () => void }) {
  const { theme } = useAppTheme();
  const [summary, setSummary] = useState<WealthHandoffSummary>();
  const [familyIds, setFamilyIds] = useState<string[]>([]);
  const [emergencyIds, setEmergencyIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    let active = true;
    wealthApi.handoffSummary()
      .then(value => { if (active) setSummary(value); })
      .catch(error => setMessage(error instanceof Error ? error.message : 'Unable to load recipients.'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const toggle = (id: string, selected: string[], update: (ids: string[]) => void) =>
    update(selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id]);

  const send = async () => {
    if (!familyIds.length && !emergencyIds.length) {
      setMessage('Select at least one recipient.');
      return;
    }
    setSending(true);
    setMessage(undefined);
    try {
      const result = await wealthApi.sendHandoff({
        familyRecipientIds: familyIds,
        emergencyRecipientIds: emergencyIds,
      });
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send handoff.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalPanel, { backgroundColor: theme.colors.background }]}>
          <Row align="center" justify="space-between">
            <AppText variant="heading">Wealth SOS handoff</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose}>
              <AppText variant="label" color="secondary">Close</AppText>
            </Pressable>
          </Row>
          <ScrollView contentContainerStyle={styles.formContent}>
            {loading ? <AppText color="secondary">Loading recipients…</AppText> : null}
            {(['family', 'emergency'] as const).map(type => {
              const recipients = summary?.recipients[type] ?? [];
              const selected = type === 'family' ? familyIds : emergencyIds;
              const update = type === 'family' ? setFamilyIds : setEmergencyIds;
              return (
                <Stack key={type} gap="xs">
                  <AppText variant="label">{type === 'family' ? 'Family recipients' : 'Emergency recipients'}</AppText>
                  {recipients.map(recipient => (
                    <Pressable
                      key={recipient.id}
                      disabled={!recipient.canReceiveHandoff}
                      onPress={() => toggle(recipient.id, selected, update)}
                      style={[styles.handoffRecipient, { borderColor: theme.colors.border }]}
                    >
                      <AppText variant="body">
                        {selected.includes(recipient.id) ? '✓ ' : ''}{recipient.name}
                      </AppText>
                      <AppText variant="caption" color="secondary">
                        {recipient.canReceiveHandoff ? recipient.accessTypeLabel : 'Not eligible'}
                      </AppText>
                    </Pressable>
                  ))}
                </Stack>
              );
            })}
            {message ? <AppText variant="caption" color="danger">{message}</AppText> : null}
            <Button title={sending ? 'Sending…' : 'Send handoff'} disabled={sending || loading} onPress={() => { send(); }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 0,
  },

  container: {
    paddingHorizontal: 16,
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  modalPanel: {
    maxHeight: '90%',
    padding: 16,
    gap: 12,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },

  formContent: {
    gap: 12,
    paddingBottom: 20,
  },

  formChoice: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 9,
    justifyContent: 'center',
  },

  formInput: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },

  handoffRecipient: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    gap: 4,
  },

  /* Header */

  headerTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pressed: {
    opacity: 0.75,
  },

  /* Search */

  searchContainer: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  guestNotice: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
  },

  errorText: {
    flex: 1,
  },

  emptyState: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 32,
    borderRadius: 16,
  },

  emptyTitle: {
    textAlign: 'center',
  },

  emptyCopy: {
    maxWidth: 300,
    textAlign: 'center',
  },

  /* Readiness */

  readinessCard: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
    borderRadius: 16,
  },

  readinessTopRow: {
    minHeight: 44,
  },

  readinessTitleRow: {
    flex: 1,
    minWidth: 0,
  },

  readinessTitle: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 22,
  },

  readinessPercentage: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
  },

  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
  },

  readinessInfo: {
    minHeight: 36,
  },

  readinessMeta: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  howButton: {
    minWidth: 66,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  debtSummary: {
    gap: 4,
    flexWrap: 'wrap',
  },

  moneyText: {
    fontWeight: '700',
    fontSize: 13,
  },

  readinessActions: {
    marginTop: 2,
  },

  primaryAction: {
    height: 70,
    flex: 1,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },

  dangerAction: {
    height: 70,
    flex: 0.82,
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },

  actionText: {
    fontSize: 15,
    lineHeight: 20,
  },

  /* Needs attention */

  attentionCard: {
    padding: 0,
    overflow: 'hidden',
  },

  attentionHeader: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  attentionHeaderTitle: {
    fontSize: 20,
    lineHeight: 24,
  },

  countBadge: {
    minWidth: 58,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionDivider: {
    height: 1,
  },

  attentionRow: {
    minHeight: 128,
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  severityColumn: {
    width: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },

  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  severityText: {
    fontSize: 15,
    lineHeight: 20,
  },

  attentionContent: {
    flex: 1,
    minWidth: 0,
  },

  attentionTitle: {
    fontSize: 17,
    lineHeight: 22,
  },

  attentionDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
  },

  attentionAction: {
    width: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    flexShrink: 0,
  },

  attentionActionText: {
    fontSize: 13,
    lineHeight: 20,
  },

  viewAllButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  viewAllText: {
    fontSize: 15,
    lineHeight: 20,
  },

  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },

  /* Categories */

  categoryContent: {
    gap: 8,
    paddingVertical: 0,
    paddingRight: 32,
  },

  categoryPill: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryText: {
    fontSize: 13,
    lineHeight: 18,
  },

  /* Required wealth groups */

  sosButton: {
    minHeight: 58,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },

  sosText: {
    color: '#111111',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },

  groupCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 14,
  },

  groupHeader: {
    minHeight: 54,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  groupTitle: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },

  groupTotal: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },

  wealthRow: {
    minHeight: 92,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  wealthIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  wealthCopy: {
    flex: 1,
    minWidth: 0,
  },

  wealthName: {
    fontSize: 15,
    lineHeight: 20,
  },

  wealthMeta: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
  },

  wealthSecondary: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
  },

  wealthWarning: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
  },

  wealthAmount: {
    maxWidth: 78,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 0,
  },

  /* Lent and borrowed */

  lendingCard: {
    padding: 0,
    overflow: 'hidden',
  },

  lendingHeader: {
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  lendingTitleRow: {
    flex: 1,
    minWidth: 0,
  },

  lendingTitle: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 20,
  },

  openBadge: {
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  recordButton: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  lendingItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 8,
    rowGap: 8,
  },

  lendingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lendingMain: {
    flex: 1,
    minWidth: 100,
  },

  lendingName: {
    fontSize: 15,
    lineHeight: 20,
  },

  lendingDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },

  amountColumn: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginLeft: 'auto',
    maxWidth: 110,
  },

  amountText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },

  amountLabel: {
    fontSize: 12,
    lineHeight: 16,
  },

  lendingActions: {
    width: '100%',
    marginLeft: 0,
    paddingLeft: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  smallAction: {
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  settledButton: {
    minWidth: 96,
    height: 40,
    marginLeft: 'auto',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  /* Other categories */

  comingSoonCard: {
    padding: 16,
  },

  comingSoonText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
  },
});