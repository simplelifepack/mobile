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
  Check,
  ChevronRight,
  CircleCheck,
  CircleDollarSign,
  HandCoins,
  KeyRound,
  Landmark,
  Plus,
  Search,
  ShieldCheck,
  Siren,
  Trash2,
  X,
} from 'lucide-react-native';

import { useAppTheme } from '../../design/theme/ThemeProvider';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { sizes } from '../../design/tokens/sizes';
import { ListGroup, ListRow } from '../../components/primitives/ListRow';
import { Row } from '../../components/primitives/Row';
import { ProcessingOverlay } from '../../components/feedback/ProcessingOverlay';
import { LoadingState } from '../../components/feedback/LoadingState';
import { AppText } from '../../components/primitives/AppText';
import { Card } from '../../components/primitives/Card';
import { Button } from '../../components/primitives/Button';
import { FloatingActionButton } from '../../components/primitives/FloatingActionButton';
import { WealthAddSheet, LentBorrowedForm } from './WealthAddSheet';
import { WealthHoldingForm } from './WealthHoldingForm';
import { pickAndSaveDocument, type SavedWealthDocument } from './wealthDocumentImport';
import {
  wealthApi,
  type WealthHandoffRecipient,
  type WealthHandoffSendResponse,
  type WealthHandoffSummary,
  type WealthRecord,
} from '../../api/wealth.api';
import { readinessTone } from '../readiness/readinessTone';
import { fontSize, lineHeight } from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';
import { formatDate } from '../../utils/format';
import { humanizeLabel } from '../../utils/format';


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
    details.counterparty ?? details.borrower ?? details.lender ?? (details.who || undefined) ?? record.title,
  );
}

function isLendingRecord(record: WealthRecord) {
  const details = record.details;
  return (
    details.recordKind === 'money_lent_borrowed' ||
    Boolean(details.counterparty ?? details.borrower ?? details.lender)
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
      ? `follow up ${formatDate(record.followUpDate)}`
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
              backgroundColor: theme.colors.surface.default,
              borderColor: theme.colors.border.default,
            },
            pressed && styles.pressed,
          ]}
        >
          <Search
            size={22}
            color={theme.colors.text.secondary}
            strokeWidth={2}
          />
        </Pressable>

        <View
          style={[
            styles.avatar,
            {
              backgroundColor: theme.colors.surface.raised,
              borderColor: theme.colors.border.default,
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
            color={theme.colors.text.secondary}
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
          style={[
            styles.readinessPercentage,
            { color: theme.colors.status[readinessTone(readiness)].text },
          ]}
        >
          {readiness}%
        </AppText>
      </Row>

      <View
        style={[
          styles.progressTrack,
          { backgroundColor: theme.colors.surface.raised },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${readiness}%`,
              backgroundColor: theme.colors.status[readinessTone(readiness)].icon,
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
              backgroundColor: theme.colors.surface.raised,
              borderColor: theme.colors.border.default,
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
          color={theme.colors.text.secondary}
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
          color={theme.colors.text.secondary}
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
  if (!records.length) {
    return null;
  }

  return (
    <View style={styles.groupCard}>
      <Row align="center" justify="space-between" style={styles.groupHeader}>
        <AppText variant="heading">{title}</AppText>
        <AppText variant="heading" color="secondary">{formatMoney(total)}</AppText>
      </Row>
      <ListGroup>
        {records.map(record => (
          <WealthRecordRow key={record.id} record={record} />
        ))}
      </ListGroup>
    </View>
  );
}

function WealthRecordRow({ record }: { record: WealthRecord }) {
  const { theme } = useAppTheme();
  const details = record.details;
  const isLoan = record.type === 'LOAN_GIVEN' || record.type === 'LOAN_TAKEN';
  const Icon = isLoan ? Landmark : record.type === 'INSURANCE' ? ShieldCheck : Building2;
  const metaLabel =
    record.type === 'ASSET' ? 'Bank account' : record.type === 'INSURANCE' ? 'Insurance' : 'Mortgage';

  const institution = String(
    details.institution ?? details.bank ?? details.provider ?? details.company ?? '',
  );
  const accountNumber = String(
    details.accountNumber ?? details.account ?? details.policyNumber ?? details.number ?? '',
  );
  const originalAmount = details.originalAmount ?? details.principal ?? details.value ?? '';

  const subtitle = [
    `${metaLabel}${institution ? ` · ${institution}` : ''}`,
    [accountNumber && `·${accountNumber}`, originalAmount !== '' && formatMoney(Number(originalAmount))]
      .filter(Boolean)
      .join(' · '),
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <ListRow
      icon={<Icon size={sizes.icon.md} color={theme.colors.icon.interactive} strokeWidth={2} />}
      title={record.title}
      subtitle={subtitle}
      extra={record.notes || undefined}
      trailing={
        <AppText
          variant="heading"
          color={record.type === 'LOAN_TAKEN' ? 'danger' : 'primary'}
          numberOfLines={1}
        >
          {record.type === 'LOAN_TAKEN' ? '−' : ''}
          {formatMoney(recordAmount(record))}
        </AppText>
      }
    />
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
                  ? theme.colors.border.interactive
                  : theme.colors.border.default,
                backgroundColor: isSelected
                  ? theme.colors.surface.raised
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
            color={theme.colors.text.secondary}
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
                  theme.colors.surface.raised,
                borderColor: theme.colors.border.default,
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
                theme.colors.surface.raised,
              borderColor: theme.colors.border.default,
            },
            pressed && styles.pressed,
          ]}
        >
          <Plus
            size={19}
            color={theme.colors.text.primary}
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
            backgroundColor: theme.colors.border.default,
          },
        ]}
      />

      {items.map((item, index) => (
        <View
          key={item.id}
          style={[
            styles.lendingItem,
            index !== items.length - 1 && {
              borderBottomColor: theme.colors.border.default,
              borderBottomWidth: 1,
            },
          ]}
        >
          <View
            style={[
              styles.lendingIcon,
              {
                backgroundColor:
                  theme.colors.surface.raised,
              },
            ]}
          >
            <CircleDollarSign
              size={23}
              color={
                item.direction === 'owedToYou'
                  ? theme.colors.status.success.text
                  : theme.colors.status.danger.text
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
            <Trash2 size={18} color={theme.colors.status.danger.text} />
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

  const refreshRecords = async () => {
    if (guestPreview) return;
    try {
      setRecords(await wealthApi.records());
      setError(undefined);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load wealth records.',
      );
    }
  };

  const lendingItems = records
    .filter(record => {
      return (
        (record.type === 'LOAN_TAKEN' || record.type === 'LOAN_GIVEN') &&
        isLendingRecord(record)
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

    const isLending = isLendingRecord(record);

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
      !isLendingRecord(record),
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

  const importAsRecord = async (document: SavedWealthDocument) => {
    try {
      const doc = document.analysis;
      const kind = `${doc.category} ${doc.documentType}`.toLowerCase();
      const type = /insurance|policy|cover/.test(kind)
        ? 'INSURANCE'
        : /loan|mortgage|liability|credit/.test(kind)
          ? 'LOAN_TAKEN'
          : 'ASSET';
      const record = await wealthApi.createRecord({
        type,
        title: document.title,
        details: {
          sourceDocumentId: document.id,
          sourceDocumentCategory: doc.category,
          sourceDocumentType: doc.documentType,
          currency: 'INR',
        },
        attachmentDocumentIds: [document.id],
      });
      setRecords(current => [record, ...current]);
      Alert.alert('Added to Wealth', `${record.title} was created from your document. You can edit its details later.`);
    } catch (importError) {
      Alert.alert(
        'Unable to add from document',
        importError instanceof Error ? importError.message : 'Please try again.',
      );
    }
  };

  const chooseDocumentSource = () => {
    setAddSheetVisible(false);
    const sources = pickAndSaveDocument(
      importAsRecord,
      () => setImporting(true),
      () => setImporting(false),
    );
    Alert.alert('From a document', 'Choose where the document comes from.', [
      ...sources,
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Screen
      scroll
      padded={false}
      onRefresh={refreshRecords}
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
                backgroundColor: theme.colors.surface.raised,
                borderColor: theme.colors.border.default,
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
                backgroundColor: theme.colors.surface.default,
                borderColor: theme.colors.border.default,
              },
            ]}
          >
            <Search
              size={19}
              color={theme.colors.text.secondary}
              strokeWidth={2}
            />

            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search investments, loans, insurance..."
              placeholderTextColor={theme.colors.text.tertiary}
              style={[
                styles.searchPlaceholder,
                { color: theme.colors.text.primary },
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
          <LoadingState label="Loading wealth records…" />
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
            { backgroundColor: theme.colors.action.destructive.default },
            pressed && styles.pressed,
          ]}
        >
          <Siren
            size={24}
            color={theme.colors.text.onBrand}
            strokeWidth={2}
          />

          <AppText
            variant="heading"
            style={[styles.sosText, { color: theme.colors.text.onBrand }]}
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
              color={theme.colors.text.interactive}
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
        <ProcessingOverlay visible={importing} label="Adding record from document…" />
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
          <WealthHoldingForm
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


function WealthHandoffModal({ onClose }: { onClose: () => void }) {
  const { theme } = useAppTheme();

  const [summary, setSummary] = useState<WealthHandoffSummary>();
  const [chosen, setChosen] = useState<string[]>([]);
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<WealthHandoffSendResponse>();

  useEffect(() => {
    let active = true;
    wealthApi
      .handoffSummary()
      .then(data => {
        if (!active) return;
        setSummary(data);
        setChosen(
          [...data.recipients.family, ...data.recipients.emergency]
            .filter(item => item.canReceiveHandoff)
            .map(item => item.id),
        );
      })
      .catch(err => {
        if (active)
          setError(
            err instanceof Error ? err.message : 'Unable to load SOS handoff.',
          );
      });
    return () => {
      active = false;
    };
  }, []);

  const recipients = summary
    ? [
        ...summary.recipients.family,
        ...summary.recipients.emergency,
        ...(summary.recipients.other ?? []),
      ]
    : [];
  const docs =
    summary?.handoffTypes.reduce(
      (sum, item) => sum + item.counts.documents + item.counts.images,
      0,
    ) ?? 0;
  const selectedFamily =
    summary?.recipients.family
      .filter(item => chosen.includes(item.id))
      .map(item => item.id) ?? [];
  const selectedEmergency =
    summary?.recipients.emergency
      .filter(item => chosen.includes(item.id))
      .map(item => item.id) ?? [];
  const canSend = chosen.length > 0 && ack && !busy;

  const toggle = (recipient: WealthHandoffRecipient) => {
    if (!recipient.canReceiveHandoff) return;
    setChosen(current =>
      current.includes(recipient.id)
        ? current.filter(id => id !== recipient.id)
        : [...current, recipient.id],
    );
  };

  const release = async () => {
    if (!canSend) return;
    setBusy(true);
    setError('');
    try {
      setDone(
        await wealthApi.sendHandoff({
          familyRecipientIds: selectedFamily,
          emergencyRecipientIds: selectedEmergency,
        }),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to release SOS handoff.',
      );
    } finally {
      setBusy(false);
    }
  };

  const sent = done?.results.filter(item => item.sent).length ?? 0;

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.modalBackdrop, { backgroundColor: theme.colors.overlay.scrim }]}>
        <View
          style={[
            styles.modalPanel,
            styles.sosPanel,
            {
              backgroundColor: theme.colors.surface.default,
              borderColor: theme.colors.border.default,
            },
          ]}
        >
          <View
            style={[styles.sosHandle, { backgroundColor: theme.colors.border.default }]}
          />

          <Row align="center" justify="space-between">
            <Row align="center" gap="sm">
              <Siren size={22} color={theme.colors.status.danger.text} strokeWidth={2} />
              <AppText variant="heading">SOS handoff</AppText>
            </Row>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close SOS handoff"
              onPress={onClose}
              style={styles.sosCloseButton}
            >
              <X size={20} color={theme.colors.text.secondary} />
            </Pressable>
          </Row>

          {error ? (
            <AppText variant="caption" color="danger">
              {error}
            </AppText>
          ) : null}

          {!summary && !error ? (
            <LoadingState label="Loading emergency handoff…" size={28} />
          ) : done ? (
            <View style={styles.sosSuccess}>
              <CircleCheck
                size={52}
                color={theme.colors.text.interactive}
                strokeWidth={1.8}
              />
              <AppText variant="heading">SOS handoff released</AppText>
              <AppText color="secondary">
                {sent} sent, {done.results.length - sent} failed.
              </AppText>
              {done.results.map(item => (
                <AppText
                  key={`${item.handoffType}-${item.email}`}
                  variant="caption"
                  color="secondary"
                >
                  {item.email}: {item.sent ? 'sent' : item.reason ?? 'failed'}
                </AppText>
              ))}
              <Button title="Done" onPress={onClose} />
            </View>
          ) : summary ? (
            <>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sosContent}
              >
                <AppText color="secondary">
                  For a real emergency. Releases {docs} wealth documents and
                  every access instruction to the people below, so nothing is
                  locked away when it matters.
                </AppText>

                <AppText variant="caption" color="secondary">
                  WHO STEPS IN
                </AppText>

                {recipients.length ? (
                  <View style={styles.sosGroup}>
                    {recipients.map(recipient => {
                      const isSelected = chosen.includes(recipient.id);
                      const tone =
                        recipient.type === 'family'
                          ? theme.colors.status.success.text
                          : theme.colors.text.interactive;
                      return (
                        <Pressable
                          key={recipient.id}
                          accessibilityRole="checkbox"
                          accessibilityState={{
                            checked: isSelected,
                            disabled: !recipient.canReceiveHandoff,
                          }}
                          disabled={!recipient.canReceiveHandoff}
                          onPress={() => toggle(recipient)}
                          style={[
                            styles.sosRecipient,
                            {
                              borderColor: isSelected
                                ? theme.colors.border.interactive
                                : theme.colors.border.default,
                              backgroundColor: theme.colors.surface.canvas,
                              opacity: recipient.canReceiveHandoff ? 1 : 0.55,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.sosAvatar,
                              { backgroundColor: `${tone}2E` },
                            ]}
                          >
                            <AppText variant="label" style={{ color: tone }}>
                              {recipient.name.charAt(0).toUpperCase()}
                            </AppText>
                          </View>
                          <View style={styles.sosRecipientDetails}>
                            <AppText variant="body">{recipient.name}</AppText>
                            <AppText variant="caption" color="secondary">
                              {humanizeLabel(recipient.relationship)} ·{' '}
                              {recipient.accessTypeLabel}
                            </AppText>
                            <AppText variant="caption" color="secondary">
                              {recipient.email}
                              {recipient.canReceiveHandoff
                                ? ''
                                : ' · not enabled for SOS handoff'}
                            </AppText>
                          </View>
                          <View
                            style={[
                              styles.sosCheckbox,
                              {
                                borderColor: isSelected
                                  ? theme.colors.border.interactive
                                  : theme.colors.border.default,
                                backgroundColor: isSelected
                                  ? theme.colors.action.primary.default
                                  : 'transparent',
                              },
                            ]}
                          >
                            {isSelected ? (
                              <Check size={14} color={theme.colors.text.onBrand} />
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.sosGroup}>
                    <AppText color="secondary">
                      Nobody is set up to receive a handoff yet.
                    </AppText>
                  </View>
                )}

                <View
                  style={[
                    styles.sosInfoCard,
                    {
                      backgroundColor: theme.colors.surface.canvas,
                      borderColor: theme.colors.border.default,
                    },
                  ]}
                >
                  <AppText variant="label">They receive</AppText>
                  <AppText variant="caption" style={{ color: theme.colors.status.success.text }}>
                    ✓ {docs} wealth documents (deeds, policies, statements)
                  </AppText>
                  <AppText variant="caption" style={{ color: theme.colors.status.success.text }}>
                    ✓ Access instructions per holding
                  </AppText>
                  <AppText variant="caption" color="secondary">
                    ✗ Health records · ✗ personal notes · ✗ anything outside
                    Wealth
                  </AppText>
                </View>

                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: ack }}
                  onPress={() => setAck(value => !value)}
                  style={styles.sosConsentRow}
                >
                  <View
                    style={[
                      styles.sosCheckbox,
                      {
                        borderColor: ack
                          ? theme.colors.border.interactive
                          : theme.colors.border.default,
                        backgroundColor: ack
                          ? theme.colors.action.primary.default
                          : 'transparent',
                      },
                    ]}
                  >
                    {ack ? (
                      <Check size={14} color={theme.colors.text.onBrand} />
                    ) : null}
                  </View>
                  <View style={styles.sosRecipientDetails}>
                    <AppText variant="caption" color="secondary">
                      I understand this shares my financial documents with the
                      selected people now, and that I can cancel and revoke
                      access at any time.
                    </AppText>
                  </View>
                </Pressable>
              </ScrollView>

              <View style={[styles.sosActions, { borderTopColor: theme.colors.border.subtle }]}>
                <Button
                  title={
                    busy
                      ? 'Releasing…'
                      : `Release handoff to ${chosen.length} ${
                          chosen.length === 1 ? 'person' : 'people'
                        }`
                  }
                  variant="danger"
                  disabled={!canSend}
                  onPress={release}
                />
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({

  sosPanel: {
    maxHeight: '92%',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopLeftRadius: radius.overlay,
    borderTopRightRadius: radius.overlay,
    borderWidth: 1,
    borderBottomWidth: 0,
  },

  sosHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: radius.pill,
    marginBottom: 12,
  },

  sosCloseButton: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sosContent: {
    gap: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },

  sosInfoCard: {
    gap: 4,
    padding: 14,
    borderWidth: 1,
    borderRadius: radius.surface,
  },

  sosGroup: {
    gap: 10,
  },

  sosRecipient: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.surface,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },

  sosAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sosRecipientDetails: {
    flex: 1,
    gap: 4,
  },

  sosCheckbox: {
    width: 22,
    height: 22,
    borderRadius: radius.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sosConsentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },

  sosActions: {
    gap: 10,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  sosSuccess: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 32,
  },

  screenContent: {
    paddingHorizontal: 0,
  },

  container: {
    paddingHorizontal: 16,
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  modalPanel: {
    maxHeight: '90%',
    padding: 16,
    gap: 12,
    borderTopLeftRadius: radius.tile,
    borderTopRightRadius: radius.tile,
  },

  formContent: {
    gap: 12,
    paddingBottom: 20,
  },

  formChoice: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radius.surface,
    justifyContent: 'center',
  },

  formInput: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radius.control,
  },




















  handoffRecipient: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radius.surface,
    justifyContent: 'center',
    gap: 4,
  },

  /* Header */

  headerTitle: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: '700',
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: radius.overlay,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.overlay,
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
    borderRadius: radius.surface,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  searchPlaceholder: {
    flex: 1,
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
  },

  guestNotice: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radius.surface,
  },

  errorText: {
    flex: 1,
  },

  emptyState: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 32,
    borderRadius: radius.tile,
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
    borderRadius: radius.tile,
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
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
  },

  readinessPercentage: {
    fontSize: fontSize.headingXl,
    lineHeight: lineHeight.headingXl,
    fontWeight: '700',
  },

  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },

  readinessInfo: {
    minHeight: 36,
  },

  readinessMeta: {
    flex: 1,
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
  },

  howButton: {
    minWidth: 66,
    height: 38,
    borderRadius: radius.control,
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
    fontSize: fontSize.caption,
  },

  readinessActions: {
    marginTop: 2,
  },

  primaryAction: {
    height: 70,
    flex: 1,
    borderRadius: radius.tile,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },

  dangerAction: {
    height: 70,
    flex: 0.82,
    borderRadius: radius.tile,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },

  actionText: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
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
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
  },

  countBadge: {
    minWidth: 58,
    height: 44,
    borderRadius: radius.overlay,
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
    borderRadius: radius.control,
  },

  severityText: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
  },

  attentionContent: {
    flex: 1,
    minWidth: 0,
  },

  attentionTitle: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
  },

  attentionDescription: {
    marginTop: 4,
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
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
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
  },

  viewAllButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },

  viewAllText: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
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
    borderRadius: radius.overlay,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryText: {
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
  },

  /* Required wealth groups */

  sosButton: {
    minHeight: 58,
    borderRadius: radius.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },

  sosText: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontWeight: '700',
  },

  groupCard: {
    gap: 8,
  },

  groupHeader: {
    paddingHorizontal: 4,
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
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
  },

  openBadge: {
    height: 32,
    borderRadius: radius.tile,
    borderWidth: 1,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  recordButton: {
    height: 38,
    borderRadius: radius.surface,
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
    borderRadius: radius.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lendingMain: {
    flex: 1,
    minWidth: 100,
  },

  lendingName: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
  },

  lendingDescription: {
    marginTop: 4,
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
  },

  amountColumn: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginLeft: 'auto',
    maxWidth: 110,
  },

  amountText: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
    fontWeight: '700',
  },

  amountLabel: {
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
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
    borderRadius: radius.tile,
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
    borderRadius: radius.surface,
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
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
  },
});
