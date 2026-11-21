import React, { useEffect, useRef, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileAvatarButton } from '../../components/navigation/ProfileAvatarButton';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  Building2,
  Check,
  Clock3,
  ChevronRight,
  CircleCheck,
  CircleDollarSign,
  CircleHelp,
  FileText,
  Landmark,
  Search,
  ShieldCheck,
  Siren,
  Users,
  X,
} from 'lucide-react-native';

import { useAppSelector } from '../../app/store/hooks';
import type { RootStackParamList } from '../../app/navigation/types';
import { healthApi } from '../../api/health.api';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { sizes } from '../../design/tokens/sizes';
import { Row } from '../../components/primitives/Row';
import { SkeletonList } from '../../components/feedback/SkeletonList';
import { LoadingState } from '../../components/feedback/LoadingState';
import { AppText } from '../../components/primitives/AppText';
import { Card } from '../../components/primitives/Card';
import { Button } from '../../components/primitives/Button';
import { FloatingActionButton } from '../../components/primitives/FloatingActionButton';
import { WealthAddSheet, LentBorrowedForm } from './WealthAddSheet';
import { WealthHoldingForm } from './WealthHoldingForm';
import {
  WealthEntrySourceScreen,
  type WealthEntryKind,
  type WealthEntrySource,
} from './WealthEntrySourceScreen';
import {
  analysisFromVaultDocument,
  WealthDocumentPicker,
} from './WealthDocumentPicker';
import { ReadinessExplainer } from './ReadinessExplainer';
import { MissingDetailsScreen } from './MissingDetailsScreen';
import {
  WealthRecordsScreen,
  type WealthRecordScreenKind,
} from './WealthRecordsScreen';
import { WealthRecordDetailsModal } from './WealthAccountDetails';
import { LoanAccessNoteScreen } from './LoanAccessNoteScreen';
import {
  WealthEmptyOverview,
  WealthEmptyOverviewActions,
} from './WealthEmptyOverview';
import { WealthDocumentUploadScreen } from './WealthDocumentUploadScreen';
import { LentBorrowedScreen } from './LentBorrowedScreen';
import {
  emailDeliveryFailureReason,
  handoffOutcome,
  smsDeliveryLabel,
} from './handoffDelivery';
import { QuietPeriodScreen } from '../profile/QuietPeriodScreen';
import { type SavedWealthDocument } from './wealthDocumentImport';
import { recordReadinessGaps, wealthReadiness } from './wealthReadiness';
import {
  wealthApi,
  type WealthHandoffRecipient,
  type WealthHandoffSendResponse,
  type WealthHandoffSummary,
  type WealthRecord,
  type WealthRecordPayload,
} from '../../api/wealth.api';
import { fontSize, lineHeight } from '../../design/tokens/typography';
import { radius } from '../../design/tokens/radius';
import { space } from '../../design/tokens/spacing';
import { formatDate } from '../../utils/format';
import { humanizeLabel } from '../../utils/format';
import {
  quietPeriodPreference,
  type QuietPeriodHours,
} from '../profile/quietPeriodPreference';

const ANDROID_MODAL_TRANSITION_DELAY_MS = 350;

function handoffCountLabel(
  handoffTypes: WealthHandoffSummary['handoffTypes'],
  countForType: (item: WealthHandoffSummary['handoffTypes'][number]) => number,
  singular: string,
  plural: string,
) {
  if (handoffTypes.length === 0) return `No ${plural} included`;

  const counts = handoffTypes.map(item => ({
    label: item.label,
    count: countForType(item),
  }));
  const formatCount = (count: number) =>
    `${count} ${count === 1 ? singular : plural}`;

  if (new Set(counts.map(item => item.count)).size === 1) {
    return formatCount(counts[0].count);
  }

  return counts
    .map(item => `${item.label}: ${formatCount(item.count)}`)
    .join(' · ');
}

function recipientSummary(names: string[]) {
  if (names.length === 0) return 'No recipients selected';
  if (names.length <= 2) return `To ${names.join(' and ')}`;
  return `To ${names[0]} and ${names.length - 1} others`;
}

function formatMoney(value: number) {
  const amount = Math.abs(value);

  if (amount >= 10_000_000) {
    return `₹${(value / 10_000_000).toFixed(
      amount % 10_000_000 === 0 ? 0 : 1,
    )}Cr`;
  }

  if (amount >= 100_000) {
    return `₹${(value / 100_000).toFixed(amount % 100_000 === 0 ? 0 : 1)}L`;
  }

  if (amount >= 1_000) {
    return `₹${Math.round(value / 1_000)}K`;
  }

  return `₹${value.toLocaleString('en-IN')}`;
}

function formatExactMoney(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

function recordAmount(record: WealthRecord) {
  const details = record.details;
  const amount =
    details.outstanding ??
    details.coverageAmount ??
    details.sumAssured ??
    details.balance ??
    details.currentBalance ??
    details.marketValue ??
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
    details.counterparty ??
      details.borrower ??
      details.lender ??
      (details.who || undefined) ??
      record.title,
  );
}

function isLendingRecord(record: WealthRecord) {
  const details = record.details;
  return (
    details.recordKind === 'money_lent_borrowed' ||
    Boolean(details.counterparty ?? details.borrower ?? details.lender)
  );
}

function detailsAreSettled(record: WealthRecord) {
  return (
    record.details.status === 'settled' || record.details.status === 'SETTLED'
  );
}

function Header({ onSearch }: { onSearch: () => void }) {
  const { theme } = useAppTheme();

  return (
    <Row align="center" justify="space-between">
      <AppText variant="title">Wealth</AppText>

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
            size={sizes.icon.md}
            color={theme.colors.text.secondary}
            strokeWidth={2}
          />
        </Pressable>

        <ProfileAvatarButton />
      </Row>
    </Row>
  );
}

function ReadinessCard({
  records,
  onExplain,
}: {
  records: WealthRecord[];
  onExplain: () => void;
}) {
  const { theme } = useAppTheme();
  const {
    holdings,
    complete,
    percentage: readiness,
  } = wealthReadiness(records);

  return (
    <Card
      style={[
        styles.readinessCard,
        {
          backgroundColor: theme.colors.surface.brandTint,
        },
      ]}
    >
      <Stack gap="xs">
        <AppText
          variant="label"
          style={{ color: theme.colors.text.interactive }}
        >
          Family access readiness
        </AppText>
        <AppText
          variant="caption"
          style={{ color: theme.colors.text.primary }}
        >
          {holdings.length
            ? `${complete.length} of ${holdings.length} holdings have all the details your family needs`
            : 'Add holdings to build family access readiness'}
        </AppText>
      </Stack>
      <AppText
        variant="display"
        style={{ color: theme.colors.text.primary }}
      >
        {readiness}%
      </AppText>
      <View
        accessibilityLabel={`${readiness} percent ready`}
        style={[
          styles.progressTrack,
          { backgroundColor: theme.colors.surface.default },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${readiness}%`,
              backgroundColor: theme.colors.text.interactive,
            },
          ]}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="What counts toward this score?"
        onPress={onExplain}
        style={({ pressed }) => [
          styles.readinessExplainAction,
          {
            borderColor: theme.colors.border.interactive,
            opacity: pressed ? 0.78 : 1,
          },
        ]}
      >
        <AppText
          variant="caption"
          style={{ color: theme.colors.text.interactive }}
        >
          What counts toward this score?
        </AppText>
        <CircleHelp
          size={sizes.icon.sm}
          color={theme.colors.icon.interactive}
        />
      </Pressable>
    </Card>
  );
}

const GROUP_PREVIEW_COUNT = 3;

function SectionHeader({
  title,
  onAdd,
}: {
  title: string;
  onAdd?: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Row align="center" justify="space-between" style={styles.groupHeader}>
      <AppText variant="labelMd">{title}</AppText>
      {onAdd ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add to ${title}`}
          hitSlop={8}
          onPress={onAdd}
        >
          <AppText
            variant="caption"
            style={{ color: theme.colors.text.interactive }}
          >
            Add
          </AppText>
        </Pressable>
      ) : null}
    </Row>
  );
}

function ViewAllButton({
  count,
  noun,
  expanded,
  onToggle,
  onViewAll,
  labelPrefix = 'View all',
}: {
  count: number;
  noun: string;
  expanded: boolean;
  onToggle: () => void;
  onViewAll?: () => void;
  labelPrefix?: 'View all' | 'Show all';
}) {
  const { theme } = useAppTheme();
  if (count === 0) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={expanded ? 'Show less' : `${labelPrefix} ${count} ${noun}`}
      onPress={onViewAll ?? onToggle}
      style={({ pressed }) => [
        styles.viewAllAction,
        {
          borderColor: theme.colors.border.interactive,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      <AppText variant="caption" color="primary">
        {expanded ? 'Show less' : `${labelPrefix} ${count} ${noun}`}
      </AppText>
      <ChevronRight
        size={sizes.icon.sm}
        color={theme.colors.icon.interactive}
      />
    </Pressable>
  );
}

function WealthGroupCard({
  title,
  noun,
  records,
  viewAllLabelPrefix,
  onAdd,
  userName,
  profileNames,
  onViewAll,
  onSelect,
}: {
  title: string;
  noun: string;
  records: WealthRecord[];
  viewAllLabelPrefix?: 'View all' | 'Show all';
  onAdd?: () => void;
  userName?: string;
  profileNames: ReadonlyMap<string, string>;
  onViewAll?: () => void;
  onSelect: (record: WealthRecord) => void;
}) {
  const { theme } = useAppTheme();
  const [expanded, setExpanded] = React.useState(false);

  if (!records.length) {
    return null;
  }

  const visible = expanded ? records : records.slice(0, GROUP_PREVIEW_COUNT);

  return (
    <View style={styles.groupCard}>
      <SectionHeader title={title} onAdd={onAdd} />
      <View style={styles.groupRows}>
        {visible.map(record => (
          <View
            key={record.id}
            style={[
              styles.recordCard,
              { backgroundColor: theme.colors.surface.raised },
            ]}
          >
            <WealthRecordRow
              record={record}
              userName={userName}
              profileNames={profileNames}
              onPress={() => onSelect(record)}
            />
          </View>
        ))}
      </View>
      <ViewAllButton
        count={records.length}
        noun={noun}
        expanded={expanded}
        onToggle={() => setExpanded(value => !value)}
        onViewAll={onViewAll}
        labelPrefix={viewAllLabelPrefix}
      />
    </View>
  );
}

function WealthRecordRow({
  record,
  userName,
  profileNames,
  onPress,
}: {
  record: WealthRecord;
  userName?: string;
  profileNames: ReadonlyMap<string, string>;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const details = record.details;
  const isLoan = record.type === 'LOAN_GIVEN' || record.type === 'LOAN_TAKEN';
  const Icon = isLoan
    ? Landmark
    : record.type === 'INSURANCE'
      ? ShieldCheck
      : Building2;
  const gaps = recordReadinessGaps(record);
  const ownerId = String(details.memberId ?? '');
  const ownerName =
    String(details.ownerName ?? details.memberName ?? '') ||
    (ownerId === 'you' ? userName || 'You' : profileNames.get(ownerId));
  const missingDetails = gaps.map(gap =>
    gap === 'No document'
      ? 'document'
      : gap === 'No access note'
        ? 'access note'
        : gap === 'No nominee'
          ? 'nominee'
          : gap,
  );
  const formattedMissingDetails =
    missingDetails.length > 1
      ? `${humanizeLabel(missingDetails.slice(0, -1).join(', '))} and ${missingDetails[missingDetails.length - 1]}`
      : humanizeLabel(missingDetails[0]);
  const missingSummary = missingDetails.length
    ? `${formattedMissingDetails} missing`
    : undefined;
  const renewalDate = [
    details.renewalDate,
    details.expiryDate,
    details.validUntil,
    details.validTill,
  ].find((value): value is string => typeof value === 'string' && Boolean(value));
  const insuranceType = [
    details.insuranceType,
    details.policyType,
    details.coverType,
  ].find((value): value is string => typeof value === 'string' && Boolean(value));
  const insuranceStatus = humanizeLabel(
    String(details.policyStatus ?? details.status ?? 'Active'),
  );
  const emiAmount = [
    details.emiAmount,
    details.monthlyEmi,
    details.emi,
    details.monthlyPayment,
  ].find(value => value !== undefined && value !== null && value !== '');
  const parsedEmiAmount = Number(emiAmount);
  const summary =
    missingSummary ??
    (record.type === 'INSURANCE'
      ? renewalDate
        ? `Active until ${formatDate(renewalDate)}`
        : insuranceStatus
      : record.type === 'LOAN_GIVEN' || record.type === 'LOAN_TAKEN'
        ? emiAmount !== undefined && Number.isFinite(parsedEmiAmount)
          ? `EMI ${formatExactMoney(parsedEmiAmount)}`
          : 'Access note added'
        : 'Nominee added');
  const subtitle = [
    ownerName,
    record.type === 'INSURANCE' && insuranceType && !renewalDate
      ? insuranceType
      : undefined,
    summary,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <WealthOverviewRow
      icon={
        <Icon
          size={sizes.icon.md}
          color={theme.colors.icon.interactive}
          strokeWidth={2}
        />
      }
      title={record.title}
      subtitle={subtitle}
      amount={recordAmount(record) > 0 ? formatMoney(recordAmount(record)) : undefined}
      onPress={onPress}
    />
  );
}

function WealthOverviewRow({
  icon,
  title,
  subtitle,
  amount,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  amount?: string;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.overviewRow,
        { opacity: pressed ? 0.78 : 1 },
      ]}
    >
      {icon}
      <View style={styles.recordSummary}>
        <AppText variant="label" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="caption" color="secondary" numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <View style={styles.recordTrailing}>
        {amount ? (
          <AppText variant="caption" color="primary" numberOfLines={1}>
            {amount}
          </AppText>
        ) : null}
        <ChevronRight
          size={sizes.icon.sm}
          color={theme.colors.icon.interactive}
        />
      </View>
    </Pressable>
  );
}

function LendingSection({
  records,
  onAdd,
  onOpen,
}: {
  records: WealthRecord[];
  onAdd?: () => void;
  onOpen: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.groupCard}>
      <SectionHeader title="Lent and borrowed" onAdd={onAdd} />
      <View style={styles.groupRows}>
        {records.slice(0, GROUP_PREVIEW_COUNT).map(record => {
          const dueDate = record.details.dueDate;
          const dueLabel =
            typeof dueDate === 'string' && dueDate
              ? `Due ${formatDate(dueDate)}`
              : record.followUpDate
                ? `Due ${formatDate(record.followUpDate)}`
                : undefined;
          const status = detailsAreSettled(record) ? 'Settled' : 'Unsettled';
          const title = `${record.type === 'LOAN_GIVEN' ? 'Lent to' : 'Borrowed from'} ${recordCounterparty(record)}`;
          return (
            <View
              key={record.id}
              style={[
                styles.recordCard,
                { backgroundColor: theme.colors.surface.raised },
              ]}
            >
              <WealthOverviewRow
                icon={
                  <Landmark
                    size={sizes.icon.md}
                    color={theme.colors.icon.interactive}
                    strokeWidth={2}
                  />
                }
                title={title}
                subtitle={[dueLabel, status].filter(Boolean).join(' · ')}
                amount={
                  recordAmount(record) > 0
                    ? formatExactMoney(recordAmount(record))
                    : undefined
                }
                onPress={onOpen}
              />
            </View>
          );
        })}
      </View>
      <ViewAllButton
        count={records.length}
        noun="transactions"
        expanded={false}
        onToggle={onOpen}
        onViewAll={onOpen}
      />
    </View>
  );
}

export function WealthScreen({
  guestPreview = false,
  onSignIn,
}: {
  guestPreview?: boolean;
  onSignIn?: () => void;
}) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useAppTheme();
  const [records, setRecords] = useState<WealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [reloadKey, setReloadKey] = useState(0);

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [vaultDocumentPickerVisible, setVaultDocumentPickerVisible] =
    useState(false);
  const [documentUploadVisible, setDocumentUploadVisible] = useState(false);
  const [documentUploadTarget, setDocumentUploadTarget] =
    useState<WealthRecord>();
  const [initialVaultDocument, setInitialVaultDocument] =
    useState<SavedWealthDocument>();
  const [initialTransactionProof, setInitialTransactionProof] =
    useState<SavedWealthDocument>();
  const [entrySourceKind, setEntrySourceKind] =
    useState<WealthEntryKind | null>(null);
  const [entrySourceTarget, setEntrySourceTarget] = useState<
    'holding' | 'transaction'
  >('holding');
  const [entrySourceReturnToTypes, setEntrySourceReturnToTypes] =
    useState(false);
  const [holdingKind, setHoldingKind] = useState<
    'asset' | 'liability' | 'cover'
  >('asset');
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [lentFormVisible, setLentFormVisible] = useState(false);
  const [lentBorrowedVisible, setLentBorrowedVisible] = useState(false);
  const [returnToLentBorrowed, setReturnToLentBorrowed] = useState(false);
  const [editingLendingRecord, setEditingLendingRecord] =
    useState<WealthRecord>();
  const [handoffVisible, setHandoffVisible] = useState(false);
  const [quietPeriodVisible, setQuietPeriodVisible] = useState(false);
  const [readinessExplainerVisible, setReadinessExplainerVisible] =
    useState(false);
  const [missingDetailsVisible, setMissingDetailsVisible] = useState(false);
  const [recordsScreen, setRecordsScreen] = useState<WealthRecordScreenKind>();
  const [detailRecord, setDetailRecord] = useState<WealthRecord>();
  const [loanAccessNoteRecord, setLoanAccessNoteRecord] =
    useState<WealthRecord>();
  const [editingRecord, setEditingRecord] = useState<WealthRecord>();
  const [returnToMissingDetails, setReturnToMissingDetails] = useState(false);
  const pendingEntrySourceActionRef = useRef<(() => void) | null>(null);
  const entrySourceTransitionTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const [trustedCount, setTrustedCount] = useState<number>();
  const [profileNames, setProfileNames] = useState<ReadonlyMap<string, string>>(
    new Map(),
  );
  const userName = useAppSelector(state => state.auth.user?.name);
  const userId = useAppSelector(state => state.auth.user?.id);

  useEffect(
    () => () => {
      if (entrySourceTransitionTimerRef.current) {
        clearTimeout(entrySourceTransitionTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (guestPreview) return;
    let active = true;
    healthApi
      .members()
      .then(members => {
        if (active)
          setProfileNames(
            new Map(members.map(member => [member.id, member.name])),
          );
      })
      .catch(profileError =>
        console.warn('[wealth] unable to load profile names', profileError),
      );
    return () => {
      active = false;
    };
  }, [guestPreview]);

  useFocusEffect(
    React.useCallback(() => {
      if (guestPreview) return undefined;
      let active = true;
      wealthApi
        .handoffSummary()
        .then(summary => {
          const { family, emergency, other = [] } = summary.recipients;
          if (active)
            setTrustedCount(family.length + emergency.length + other.length);
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, [guestPreview]),
  );

  const openHandoff = () =>
    guestPreview ? onSignIn?.() : setHandoffVisible(true);
  const explainReadiness = () => setReadinessExplainerVisible(true);
  const reviewIncompleteHoldings = () => {
    const incomplete = wealthReadiness(records).incomplete;
    setReadinessExplainerVisible(false);
    if (incomplete.length) {
      setMissingDetailsVisible(true);
    }
  };
  const openMissingHolding = (record: WealthRecord) => {
    setEditingRecord(record);
    setReturnToMissingDetails(true);
    setMissingDetailsVisible(false);
    setFormVisible(true);
  };
  const closeHoldingForm = (showMissingDetails = returnToMissingDetails) => {
    setFormVisible(false);
    setEditingRecord(undefined);
    setInitialVaultDocument(undefined);
    setMissingDetailsVisible(showMissingDetails);
    setReturnToMissingDetails(false);
  };

  const addDocumentToHolding = (record: WealthRecord) => {
    setDocumentUploadTarget(record);
    setDocumentUploadVisible(true);
  };

  const refreshRecords = React.useCallback(async () => {
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
  }, [guestPreview]);

  useFocusEffect(
    React.useCallback(() => {
      if (guestPreview) {
        setRecords([]);
        setLoading(false);
        setError(undefined);
        return undefined;
      }

      let active = true;
      setLoading(true);
      setError(undefined);
      wealthApi
        .records()
        .then(items => {
          if (active) {
            setRecords(items);
            setError(undefined);
          }
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
    }, [guestPreview]),
  );

  useEffect(() => {
    if (reloadKey > 0) {
      refreshRecords().then(() => undefined);
    }
  }, [refreshRecords, reloadKey]);

  const lendingRecords = records.filter(record => {
    return (
      (record.type === 'LOAN_TAKEN' || record.type === 'LOAN_GIVEN') &&
      isLendingRecord(record)
    );
  });

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

    return !isLendingRecord(record) || record.type === 'PAYMENT_PROOF';
  });

  const investmentRecords = filteredRecords.filter(
    record => record.type === 'ASSET',
  );

  const loanRecords = filteredRecords.filter(
    record =>
      (record.type === 'LOAN_GIVEN' || record.type === 'LOAN_TAKEN') &&
      !isLendingRecord(record),
  );

  const insuranceRecords = filteredRecords.filter(
    record => record.type === 'INSURANCE',
  );

  const hasVisibleRecords =
    investmentRecords.length +
      loanRecords.length +
      insuranceRecords.length +
    lendingRecords.length >
    0;
  const showEmptyOverview =
    !loading && !error && !hasVisibleRecords && !searchQuery.trim();

  const deleteRecord = (record: WealthRecord) =>
    Alert.alert('Delete wealth record?', `Delete ${record.title}?`, [
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
    ]);

  const settleLendingRecord = async (record: WealthRecord) => {
    const updated = await wealthApi.updateRecord(record.id, {
      type: record.type,
      title: record.title,
      details: { ...record.details, status: 'settled' },
      notes: record.notes,
      followUpDate: record.followUpDate,
      followUpNote: record.followUpNote,
      attachmentDocumentIds: record.attachmentDocumentIds,
    });
    setRecords(current =>
      current.map(item => (item.id === updated.id ? updated : item)),
    );
    return updated;
  };

  const saveLoanAccessNote = async (
    record: WealthRecord,
    payload: WealthRecordPayload,
  ) => {
    const updated = await wealthApi.updateRecord(record.id, payload);
    setRecords(current =>
      current.map(item => (item.id === updated.id ? updated : item)),
    );
    setDetailRecord(current =>
      current?.id === updated.id ? updated : current,
    );
  };

  const addAllowed = !guestPreview;
  const openHoldingSource = (
    kind: 'asset' | 'liability' | 'cover',
    sourceKind: WealthEntryKind,
    returnToTypes = false,
  ) => {
    setHoldingKind(kind);
    setEntrySourceTarget('holding');
    setEntrySourceKind(sourceKind);
    setEntrySourceReturnToTypes(returnToTypes);
  };
  const openTransactionSource = (returnToTypes = false) => {
    setEntrySourceTarget('transaction');
    setEntrySourceKind('transaction');
    setEntrySourceReturnToTypes(returnToTypes);
  };
  const finishEntrySourceTransition = () => {
    if (entrySourceTransitionTimerRef.current) {
      clearTimeout(entrySourceTransitionTimerRef.current);
      entrySourceTransitionTimerRef.current = null;
    }
    const action = pendingEntrySourceActionRef.current;
    pendingEntrySourceActionRef.current = null;
    action?.();
  };
  const cancelEntrySourceTransition = () => {
    pendingEntrySourceActionRef.current = null;
    if (entrySourceTransitionTimerRef.current) {
      clearTimeout(entrySourceTransitionTimerRef.current);
      entrySourceTransitionTimerRef.current = null;
    }
  };
  const transitionFromAddSheet = (action: () => void) => {
    pendingEntrySourceActionRef.current = action;
    setAddSheetVisible(false);
    if (Platform.OS !== 'ios') {
      entrySourceTransitionTimerRef.current = setTimeout(
        finishEntrySourceTransition,
        ANDROID_MODAL_TRANSITION_DELAY_MS,
      );
    }
  };
  const selectEntrySource = (source: WealthEntrySource) => {
    const target = entrySourceTarget;
    setEntrySourceReturnToTypes(false);
    pendingEntrySourceActionRef.current = () => {
      if (source === 'manual') {
        if (target === 'transaction') {
          setInitialTransactionProof(undefined);
          setEditingLendingRecord(undefined);
          setLentBorrowedVisible(true);
        } else {
          setInitialVaultDocument(undefined);
          setEditingRecord(undefined);
          setReturnToMissingDetails(false);
          setFormVisible(true);
        }
        setEntrySourceTarget('holding');
        return;
      }

      if (source === 'vault') {
        setVaultDocumentPickerVisible(true);
      } else {
        setDocumentUploadTarget(undefined);
        setDocumentUploadVisible(true);
      }
    };
    setEntrySourceKind(null);
    if (Platform.OS !== 'ios') {
      entrySourceTransitionTimerRef.current = setTimeout(
        finishEntrySourceTransition,
        ANDROID_MODAL_TRANSITION_DELAY_MS,
      );
    }
  };
  const closeEntrySourcePicker = () => {
    const returnToTransactions =
      entrySourceTarget === 'transaction' && returnToLentBorrowed;
    setEntrySourceTarget('holding');
    if (returnToTransactions) {
      setLentBorrowedVisible(true);
      setReturnToLentBorrowed(false);
    }
  };
  const renderContent = () => (
    <>
      <WealthGroupCard
        title="Accounts and investments"
        noun="accounts and investments"
        records={investmentRecords}
        viewAllLabelPrefix="Show all"
        userName={userName}
        profileNames={profileNames}
        onViewAll={() => setRecordsScreen('accounts')}
        onSelect={setDetailRecord}
        onAdd={
          addAllowed
            ? () => openHoldingSource('asset', 'investment')
            : undefined
        }
      />
      <WealthGroupCard
        title="Insurance"
        noun="policies"
        records={insuranceRecords}
        userName={userName}
        profileNames={profileNames}
        onViewAll={() => setRecordsScreen('insurance')}
        onSelect={setDetailRecord}
        onAdd={
          addAllowed ? () => openHoldingSource('cover', 'insurance') : undefined
        }
      />
      <WealthGroupCard
        title="Loans"
        noun="loans"
        records={loanRecords}
        userName={userName}
        profileNames={profileNames}
        onViewAll={() => setRecordsScreen('loans')}
        onSelect={setDetailRecord}
        onAdd={
          addAllowed ? () => openHoldingSource('liability', 'loan') : undefined
        }
      />
      {lendingRecords.some(item =>
        filteredRecords.some(record => record.id === item.id),
      ) ? (
        <LendingSection
          records={lendingRecords.filter(item =>
            filteredRecords.some(record => record.id === item.id),
          )}
          onAdd={
            addAllowed
              ? () => {
                  setReturnToLentBorrowed(true);
                  setEditingLendingRecord(undefined);
                  setLentBorrowedVisible(false);
                  openTransactionSource();
                }
              : undefined
          }
          onOpen={() => setLentBorrowedVisible(true)}
        />
      ) : null}
    </>
  );

  const chooseDocumentForForm = () => {
    setDocumentUploadVisible(true);
  };

  return (
    <Screen
      scroll
      padded={false}
      onRefresh={refreshRecords}
      contentContainerStyle={[
        styles.screenContent,
        showEmptyOverview && styles.emptyOverviewScreenContent,
      ]}
      floatingAction={
        showEmptyOverview ? (
          <WealthEmptyOverviewActions
            guestPreview={guestPreview}
            onAddFirstEntry={() =>
              guestPreview
                ? (onSignIn?.() ?? undefined)
                : setAddSheetVisible(true)
            }
            onManageTrustedPeople={() =>
              guestPreview
                ? (onSignIn?.() ?? undefined)
                : navigation.navigate('EmergencyAccess')
            }
          />
        ) : addAllowed ? (
          <FloatingActionButton
            accessibilityLabel="Add wealth entry"
            onPress={() => setAddSheetVisible(true)}
          />
        ) : null
      }
    >
      <Stack
        gap={showEmptyOverview ? 'sm' : 'md'}
        style={[
          styles.container,
          {
            paddingTop: theme.spacing.xs,
            paddingBottom: theme.spacing.xl,
          },
        ]}
      >
        <Stack gap="sm">
          <Header onSearch={() => setSearchVisible(value => !value)} />

          <Row align="center" justify="space-between">
            <AppText
              variant="caption"
              style={{ color: theme.colors.text.interactive }}
            >
              {userName ? `${userName} · You` : 'You'}
            </AppText>
            <AppText variant="caption" color="secondary">
              Private Wealth register
            </AppText>
          </Row>

          {guestPreview && !showEmptyOverview ? (
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
                <AppText variant="label" color="primary">
                  Sign in
                </AppText>
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
                size={sizes.icon.md}
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
                <AppText variant="label" color="primary">
                  Retry
                </AppText>
              </Pressable>
            </Row>
          ) : null}
        </Stack>

        {loading ? <SkeletonList label="Loading wealth…" /> : null}

        {!showEmptyOverview ? (
          <Stack gap="md" style={loading ? styles.hidden : undefined}>
            <ReadinessCard records={records} onExplain={explainReadiness} />

            <View style={styles.groupRows}>
              <View
                style={[
                  styles.recordCard,
                  { backgroundColor: theme.colors.surface.raised },
                ]}
              >
                <WealthOverviewRow
                  icon={
                    <Siren
                      size={sizes.icon.md}
                      color={theme.colors.icon.interactive}
                      strokeWidth={2}
                    />
                  }
                  title="SOS handoff"
                  subtitle="Share your register with trusted people"
                  onPress={openHandoff}
                />
              </View>
              <View
                style={[
                  styles.recordCard,
                  { backgroundColor: theme.colors.surface.raised },
                ]}
              >
                <WealthOverviewRow
                  icon={
                    <Users
                      size={sizes.icon.md}
                      color={theme.colors.icon.interactive}
                      strokeWidth={2}
                    />
                  }
                  title="Trusted people"
                  subtitle={
                    trustedCount === undefined
                      ? 'Choose who can receive your register'
                      : `${trustedCount} ${trustedCount === 1 ? 'contact' : 'contacts'}`
                  }
                  onPress={() =>
                    guestPreview
                      ? onSignIn?.()
                      : navigation.navigate('EmergencyAccess')
                  }
                />
              </View>
            </View>
          </Stack>
        ) : null}

        <Stack gap="md">
          {showEmptyOverview ? (
            <WealthEmptyOverview
              onOpenCategory={category => {
                if (category === 'Accounts and investments') {
                  setRecordsScreen('accounts');
                } else if (category === 'Insurance') {
                  setRecordsScreen('insurance');
                } else if (category === 'Loans') {
                  setRecordsScreen('loans');
                } else {
                  setLentBorrowedVisible(true);
                }
              }}
            />
          ) : !loading && !error && !hasVisibleRecords ? (
            <Card style={styles.emptyState}>
              <CircleDollarSign
                size={34}
                color={theme.colors.text.interactive}
                strokeWidth={1.8}
              />
              <AppText variant="heading" style={styles.emptyTitle}>
                {records.length
                  ? searchQuery.trim()
                    ? 'No matching entries'
                    : 'No holdings yet'
                  : 'No wealth records yet'}
              </AppText>
              <AppText
                variant="body"
                color="secondary"
                style={styles.emptyCopy}
              >
                {guestPreview
                  ? 'Sign in to securely add and manage accounts, loans, and insurance.'
                  : searchQuery.trim()
                    ? 'Try another search term or add a new wealth entry.'
                    : 'Keep accounts, investments, loans, and insurance together in one place.'}
              </AppText>
              <Button
                title={
                  guestPreview
                    ? 'Sign in to continue'
                    : searchQuery.trim()
                      ? 'Add wealth entry'
                      : 'Add first record'
                }
                onPress={
                  guestPreview
                    ? (onSignIn ?? (() => {}))
                    : () => setAddSheetVisible(true)
                }
              />
            </Card>
          ) : null}

          {hasVisibleRecords ? renderContent() : null}
        </Stack>

        <WealthAddSheet
          visible={addSheetVisible}
          onClose={() => setAddSheetVisible(false)}
          onDismiss={finishEntrySourceTransition}
          onAsset={() =>
            transitionFromAddSheet(() =>
              openHoldingSource('asset', 'asset', true),
            )
          }
          onInvestment={() =>
            transitionFromAddSheet(() =>
              openHoldingSource('asset', 'investment', true),
            )
          }
          onInsurance={() =>
            transitionFromAddSheet(() =>
              openHoldingSource('cover', 'insurance', true),
            )
          }
          onLoan={() =>
            transitionFromAddSheet(() =>
              openHoldingSource('liability', 'loan', true),
            )
          }
          onTransaction={() =>
            transitionFromAddSheet(() => openTransactionSource(true))
          }
        />
        <WealthEntrySourceScreen
          visible={entrySourceKind !== null}
          kind={entrySourceKind ?? 'asset'}
          userName={userName}
          onClose={() => {
            cancelEntrySourceTransition();
            const returnToTypes = entrySourceReturnToTypes;
            const returnToTransactions =
              entrySourceTarget === 'transaction' && returnToLentBorrowed;
            setEntrySourceKind(null);
            setEntrySourceTarget('holding');
            setEntrySourceReturnToTypes(false);
            if (returnToTransactions) {
              setLentBorrowedVisible(true);
              setReturnToLentBorrowed(false);
            }
            if (returnToTypes) setAddSheetVisible(true);
          }}
          onDismiss={finishEntrySourceTransition}
          onSelectSource={selectEntrySource}
        />
        <WealthDocumentPicker
          visible={vaultDocumentPickerVisible}
          onClose={() => {
            setVaultDocumentPickerVisible(false);
            closeEntrySourcePicker();
          }}
          onExtract={document => {
            const savedDocument: SavedWealthDocument = {
              id: document.id,
              title:
                document.displayName?.trim() ||
                document.title?.trim() ||
                document.originalName,
              analysis: analysisFromVaultDocument(document),
            };
            setVaultDocumentPickerVisible(false);
            if (entrySourceTarget === 'transaction') {
              setInitialTransactionProof(savedDocument);
              setEditingLendingRecord(undefined);
              setLentFormVisible(true);
            } else {
              setInitialVaultDocument(savedDocument);
              setEditingRecord(undefined);
              setReturnToMissingDetails(false);
              setFormVisible(true);
            }
            setEntrySourceTarget('holding');
          }}
          onUploadAnother={() => {
            setVaultDocumentPickerVisible(false);
            chooseDocumentForForm();
          }}
        />
        <WealthDocumentUploadScreen
          visible={documentUploadVisible}
          userName={userName}
          onClose={() => {
            setDocumentUploadVisible(false);
            setDocumentUploadTarget(undefined);
            closeEntrySourcePicker();
          }}
          onUploaded={async document => {
            if (documentUploadTarget) {
              const record = documentUploadTarget;
              try {
                const updated = await wealthApi.updateRecord(record.id, {
                  type: record.type,
                  title: record.title,
                  details: record.details,
                  notes: record.notes,
                  followUpDate: record.followUpDate,
                  followUpNote: record.followUpNote,
                  attachmentDocumentIds: [
                    ...new Set([
                      ...(record.attachmentDocumentIds ?? []),
                      ...record.attachments.map(item => item.documentId),
                      document.id,
                    ]),
                  ],
                });
                setRecords(current =>
                  current.map(item =>
                    item.id === updated.id ? updated : item,
                  ),
                );
                const remaining = wealthReadiness(
                  records.map(item =>
                    item.id === updated.id ? updated : item,
                  ),
                ).incomplete;
                setMissingDetailsVisible(remaining.length > 0);
              } catch (saveError) {
                Alert.alert(
                  'Unable to attach document',
                  saveError instanceof Error
                    ? saveError.message
                    : 'Please try again.',
                );
              }
              setDocumentUploadTarget(undefined);
              setEntrySourceTarget('holding');
              return;
            }
            if (entrySourceTarget === 'transaction') {
              setInitialTransactionProof(document);
              setEditingLendingRecord(undefined);
              setLentFormVisible(true);
            } else {
              setInitialVaultDocument(document);
              setEditingRecord(undefined);
              setReturnToMissingDetails(false);
              setFormVisible(true);
            }
            setEntrySourceTarget('holding');
          }}
        />
        <ReadinessExplainer
          visible={readinessExplainerVisible}
          records={records}
          userName={userName}
          onClose={() => setReadinessExplainerVisible(false)}
          onReviewIncomplete={reviewIncompleteHoldings}
        />
        <MissingDetailsScreen
          visible={missingDetailsVisible}
          records={wealthReadiness(records).incomplete}
          userName={userName}
          onClose={() => setMissingDetailsVisible(false)}
          onEdit={openMissingHolding}
          onAddDocument={addDocumentToHolding}
        />
        <WealthRecordsScreen
          visible={recordsScreen !== undefined}
          kind={recordsScreen ?? 'accounts'}
          records={
            recordsScreen === 'insurance'
              ? insuranceRecords
              : recordsScreen === 'loans'
                ? loanRecords
                : investmentRecords
          }
          userName={userName}
          profileNames={profileNames}
          onClose={() => setRecordsScreen(undefined)}
          onAdd={() => {
            const kind =
              recordsScreen === 'insurance'
                ? 'cover'
                : recordsScreen === 'loans'
                  ? 'liability'
                  : 'asset';
            const sourceKind: WealthEntryKind =
              recordsScreen === 'insurance'
                ? 'insurance'
                : recordsScreen === 'loans'
                  ? 'loan'
                  : 'investment';
            setRecordsScreen(undefined);
            openHoldingSource(kind, sourceKind);
          }}
          onEdit={record => {
            setRecordsScreen(undefined);
            setEditingRecord(record);
            setReturnToMissingDetails(false);
            setFormVisible(true);
          }}
          onEditAccessNote={record => setLoanAccessNoteRecord(record)}
        />
        <WealthRecordDetailsModal
          visible={Boolean(detailRecord)}
          record={detailRecord}
          userName={userName}
          profileNames={profileNames}
          onClose={() => setDetailRecord(undefined)}
          onEdit={record => {
            setDetailRecord(undefined);
            setEditingRecord(record);
            setReturnToMissingDetails(false);
            setFormVisible(true);
          }}
          onEditAccessNote={record => setLoanAccessNoteRecord(record)}
        />
        {loanAccessNoteRecord ? (
          <LoanAccessNoteScreen
            visible
            record={loanAccessNoteRecord}
            userName={userName}
            onClose={() => setLoanAccessNoteRecord(undefined)}
            onSave={payload =>
              saveLoanAccessNote(loanAccessNoteRecord, payload)
            }
          />
        ) : null}
        <LentBorrowedScreen
          visible={lentBorrowedVisible}
          records={records.filter(
            record =>
              (record.type === 'LOAN_GIVEN' || record.type === 'LOAN_TAKEN') &&
              isLendingRecord(record),
          )}
          userName={userName}
          onClose={() => setLentBorrowedVisible(false)}
          onAdd={() => {
            setReturnToLentBorrowed(true);
            setEditingLendingRecord(undefined);
            setLentBorrowedVisible(false);
            openTransactionSource();
          }}
          onDelete={deleteRecord}
          onEdit={record => {
            setReturnToLentBorrowed(true);
            setEditingLendingRecord(record);
            setLentBorrowedVisible(false);
            setLentFormVisible(true);
          }}
          onSettle={settleLendingRecord}
        />
        {lentFormVisible ? (
          <LentBorrowedForm
            initialRecord={editingLendingRecord}
            initialProof={
              editingLendingRecord ? undefined : initialTransactionProof
            }
            onClose={() => {
              setLentFormVisible(false);
              setEditingLendingRecord(undefined);
              setInitialTransactionProof(undefined);
              if (returnToLentBorrowed) {
                setLentBorrowedVisible(true);
                setReturnToLentBorrowed(false);
              }
            }}
            onCreated={record => {
              setRecords(current =>
                editingLendingRecord
                  ? current.map(item => (item.id === record.id ? record : item))
                  : [record, ...current],
              );
              setLentFormVisible(false);
              setEditingLendingRecord(undefined);
              setInitialTransactionProof(undefined);
              if (returnToLentBorrowed) {
                setLentBorrowedVisible(true);
                setReturnToLentBorrowed(false);
              }
            }}
          />
        ) : null}
        {formVisible ? (
          <WealthHoldingForm
            initialKind={holdingKind}
            initialRecord={editingRecord}
            initialDocument={initialVaultDocument}
            onClose={closeHoldingForm}
            onCreated={record => {
              const nextRecords = editingRecord
                ? records.map(item => (item.id === record.id ? record : item))
                : [record, ...records];
              setRecords(nextRecords);
              if (returnToMissingDetails) {
                closeHoldingForm(
                  wealthReadiness(nextRecords).incomplete.length > 0,
                );
              } else {
                setFormVisible(false);
                setEditingRecord(undefined);
                setInitialVaultDocument(undefined);
              }
            }}
          />
        ) : null}

        <WealthHandoffModal
          key={userId ?? 'anonymous'}
          visible={handoffVisible}
          onClose={() => setHandoffVisible(false)}
          onManageTrustedPeople={() => {
            setHandoffVisible(false);
            navigation.navigate('EmergencyAccess');
          }}
          onEditQuietPeriod={() => {
            setHandoffVisible(false);
            setQuietPeriodVisible(true);
          }}
        />
        {quietPeriodVisible && userId ? (
          <QuietPeriodScreen
            userId={userId}
            userName={userName}
            onClose={() => {
              setQuietPeriodVisible(false);
              setHandoffVisible(true);
            }}
            onSaved={() => undefined}
          />
        ) : null}
      </Stack>
    </Screen>
  );
}

export function WealthHandoffModal({
  visible = true,
  onClose,
  onManageTrustedPeople,
  onEditQuietPeriod,
}: {
  visible?: boolean;
  onClose: () => void;
  onManageTrustedPeople?: () => void;
  onEditQuietPeriod?: () => void;
}) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const userId = useAppSelector(state => state.auth.user?.id);
  const userName = useAppSelector(state => state.auth.user?.name);

  const contentScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [summary, setSummary] = useState<WealthHandoffSummary>();
  const [chosen, setChosen] = useState<string[]>([]);
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<WealthHandoffSendResponse>();
  const [showRevokeInfo, setShowRevokeInfo] = useState(false);
  const [sendStartedAt, setSendStartedAt] = useState<Date>();
  const [sendCompletedAt, setSendCompletedAt] = useState<Date>();
  const [quietPeriod, setQuietPeriod] = useState<QuietPeriodHours>(24);
  const [quietPeriodError, setQuietPeriodError] = useState<string>();
  const [step, setStep] = useState<
    'select' | 'consent' | 'review' | 'quiet-period-preview'
  >('select');

  useEffect(() => {
    contentScrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  useEffect(() => {
    if (!visible || summary) return;
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
  }, [visible, summary]);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    quietPeriodPreference
      .read(userId)
      .then(hours => {
        if (active) {
          setQuietPeriod(hours);
          setQuietPeriodError(undefined);
        }
      })
      .catch(preferenceError => {
        if (active) {
          setQuietPeriodError(
            preferenceError instanceof Error
              ? preferenceError.message
              : 'Unable to load the saved quiet-period preference.',
          );
        }
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const recipients = summary
    ? [
        ...summary.recipients.family,
        ...summary.recipients.emergency,
        ...(summary.recipients.other ?? []),
      ]
    : [];
  const selectedFamily =
    summary?.recipients.family
      .filter(item => chosen.includes(item.id))
      .map(item => item.id) ?? [];
  const selectedEmergency =
    summary?.recipients.emergency
      .filter(item => chosen.includes(item.id))
      .map(item => item.id) ?? [];
  const selectedHandoffTypes =
    summary?.handoffTypes.filter(item =>
      item.type === 'family'
        ? selectedFamily.length > 0
        : selectedEmergency.length > 0,
    ) ?? [];
  const selectedRecipientNames = recipients
    .filter(recipient => chosen.includes(recipient.id))
    .map(recipient => recipient.name);
  const selectedRecipients = recipients.filter(recipient =>
    chosen.includes(recipient.id),
  );
  const includedContents = [
    ...new Set(selectedHandoffTypes.flatMap(item => item.contents)),
  ];
  const excludedContents = [
    ...new Set(selectedHandoffTypes.flatMap(item => item.excluded)),
  ];
  const canSend =
    step === 'review' &&
    chosen.length > 0 &&
    (!summary?.smsSupported || chosen.length <= 10) &&
    ack &&
    !busy;
  const canContinue =
    chosen.length > 0 &&
    (!summary?.smsSupported || chosen.length <= 10) &&
    !busy;
  const canReview = ack && !busy;

  const canSelectRecipient = (recipient: WealthHandoffRecipient) =>
    recipient.canReceiveHandoff && recipient.type !== 'other';

  const toggle = (recipient: WealthHandoffRecipient) => {
    if (!canSelectRecipient(recipient)) return;
    setChosen(current =>
      current.includes(recipient.id)
        ? current.filter(id => id !== recipient.id)
        : [...current, recipient.id],
    );
  };

  const release = async () => {
    if (!canSend) return;
    setBusy(true);
    setSendStartedAt(new Date());
    setError('');
    try {
      setDone(
        await wealthApi.sendHandoff({
          familyRecipientIds: selectedFamily,
          emergencyRecipientIds: selectedEmergency,
          ...(summary?.smsSupported ? { sendSms: true } : {}),
        }),
      );
      setSendCompletedAt(new Date());
    } catch (err) {
      setError(
        `${err instanceof Error ? err.message : 'Unable to release SOS handoff.'} Delivery may have started; check with recipients before retrying.`,
      );
    } finally {
      setBusy(false);
    }
  };

  const sent = done?.results.filter(item => item.sent).length ?? 0;
  const outcome = done ? handoffOutcome(done.results) : undefined;
  const outcomeCopy = {
    delivered: {
      title: 'Handoff delivered',
      summary: `Email accepted for ${sent === 1 ? '1 trusted person' : `${sent} trusted people`}`,
      color: theme.colors.status.success.text,
      surface: theme.colors.status.success.surface,
    },
    partial: {
      title: 'Handoff partially delivered',
      summary: `Email accepted for ${sent} of ${done?.results.length ?? 0} trusted people`,
      color: theme.colors.status.warning.text,
      surface: theme.colors.status.warning.surface,
    },
    failed: {
      title: 'Handoff delivery failed',
      summary: `No emails were accepted for delivery (${done?.results.length ?? 0} ${done?.results.length === 1 ? 'recipient' : 'recipients'})`,
      color: theme.colors.status.danger.text,
      surface: theme.colors.status.danger.surface,
    },
  } as const;
  const formatHandoffDate = (date: Date | undefined) =>
    date
      ? date.toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : 'Time unavailable';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.sosScreen,
          {
            backgroundColor: theme.colors.surface.canvas,
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <View
          style={[
            styles.sosPanel,
            {
              backgroundColor: theme.colors.surface.canvas,
            },
          ]}
        >
          <Row align="center" justify="space-between">
            <Row align="center" gap="sm">
              <Siren
                size={sizes.icon.md}
                color={theme.colors.status.danger.text}
                strokeWidth={2}
              />
              <AppText variant="heading">
                {done
                  ? showRevokeInfo
                    ? 'Revoke handoff'
                    : outcome
                      ? outcomeCopy[outcome].title
                      : 'Delivery results'
                  : busy
                    ? 'Sending handoff'
                    : step === 'consent'
                      ? 'Sharing consent'
                      : step === 'review'
                        ? 'Review handoff'
                        : step === 'quiet-period-preview'
                          ? 'Quiet period preview'
                          : 'SOS handoff'}
              </AppText>
            </Row>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close SOS handoff"
              onPress={onClose}
              style={styles.sosCloseButton}
            >
              <X size={sizes.icon.md} color={theme.colors.text.secondary} />
            </Pressable>
          </Row>
          <Row
            align="center"
            justify="space-between"
            style={styles.sosFamilyContext}
          >
            <AppText variant="caption" color="interactive">
              {userName ? `${userName} · You` : 'You'}
            </AppText>
            <AppText variant="caption" color="secondary">
              Private Wealth register
            </AppText>
          </Row>

          {error ? (
            <AppText variant="caption" color="danger">
              {error}
            </AppText>
          ) : null}

          {!summary && !error ? (
            <LoadingState label="Loading emergency handoff…" size={28} />
          ) : done && summary && showRevokeInfo ? (
            <>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sosContent}
              >
                <AppText variant="caption" color="interactive">
                  Handoff access
                </AppText>
                <View
                  style={[
                    styles.sosWarning,
                    { backgroundColor: theme.colors.status.warning.surface },
                  ]}
                >
                  <AppText
                    variant="label"
                    style={{ color: theme.colors.status.warning.text }}
                  >
                    Sent links can’t be revoked from this app
                  </AppText>
                  <AppText variant="bodySm">
                    The handoff service doesn’t currently support revoking
                    delivered access links. Removing a trusted person prevents
                    future handoffs, but won’t withdraw links already sent.
                  </AppText>
                </View>
                <View style={styles.sosDisclosureGroup}>
                  {done.results
                    .filter(item => item.sent)
                    .map(item => {
                      const recipient = recipients.find(
                        candidate => candidate.id === item.recipientId,
                      );
                      return (
                        <View
                          key={`${item.handoffType}-${item.recipientId}-${item.email}`}
                          style={[
                            styles.sosDisclosureRow,
                            { backgroundColor: theme.colors.surface.raised },
                          ]}
                        >
                          <CircleCheck
                            size={sizes.icon.md}
                            color={theme.colors.status.success.text}
                          />
                          <View style={styles.sosRecipientDetails}>
                            <AppText variant="label">
                              {recipient?.name ?? item.email}
                            </AppText>
                            <AppText variant="caption" color="secondary">
                              Handoff email accepted · {item.email}
                            </AppText>
                          </View>
                        </View>
                      );
                    })}
                </View>
                <View
                  style={[
                    styles.sosWarning,
                    { backgroundColor: theme.colors.surface.brandTint },
                  ]}
                >
                  <AppText variant="label" color="interactive">
                    Manage future access
                  </AppText>
                  <AppText variant="bodySm">
                    You can remove a trusted person to stop including them in
                    future handoffs.
                  </AppText>
                </View>
              </ScrollView>
              <View
                style={[
                  styles.sosActions,
                  { borderTopColor: theme.colors.border.subtle },
                ]}
              >
                {onManageTrustedPeople ? (
                  <Button
                    title="Manage trusted people"
                    onPress={onManageTrustedPeople}
                  />
                ) : null}
                <Button
                  title="Back to delivery results"
                  variant="secondary"
                  onPress={() => setShowRevokeInfo(false)}
                />
              </View>
            </>
          ) : done && summary ? (
            <>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sosContent}
              >
                <AppText variant="caption" color="interactive">
                  Step 3 of 3 ·{' '}
                  {outcome === 'delivered'
                    ? 'Handoff delivered'
                    : outcome === 'partial'
                      ? 'Partial delivery'
                      : 'Delivery failed'}
                </AppText>
                <View
                  style={[
                    styles.sosIntro,
                    {
                      backgroundColor: outcome
                        ? outcomeCopy[outcome].surface
                        : theme.colors.surface.raised,
                    },
                  ]}
                >
                  <AppText
                    variant="label"
                    style={{
                      color: outcome
                        ? outcomeCopy[outcome].color
                        : theme.colors.text.primary,
                    }}
                  >
                    {outcome
                      ? outcomeCopy[outcome].summary
                      : 'No results returned'}
                  </AppText>
                  <AppText variant="bodySm">
                    Results received · {formatHandoffDate(sendCompletedAt)}
                  </AppText>
                </View>
                <View style={styles.sosDisclosureGroup}>
                  {done.results.map(item => {
                    const recipient = recipients.find(
                      candidate => candidate.id === item.recipientId,
                    );
                    return (
                      <View
                        key={`${item.handoffType}-${item.recipientId}-${item.email}`}
                        style={[
                          styles.sosDisclosureRow,
                          { backgroundColor: theme.colors.surface.raised },
                        ]}
                      >
                        {item.sent ? (
                          <CircleCheck
                            size={sizes.icon.md}
                            color={theme.colors.status.success.text}
                          />
                        ) : (
                          <X
                            size={sizes.icon.md}
                            color={theme.colors.status.danger.text}
                          />
                        )}
                        <View style={styles.sosRecipientDetails}>
                          <AppText variant="label">
                            {recipient?.name ?? item.email} ·{' '}
                            {item.sent
                              ? 'Email accepted'
                              : 'Email not accepted'}
                          </AppText>
                          <AppText variant="caption" color="secondary">
                            {item.email} ·{' '}
                            {item.sent
                              ? 'Read status unavailable'
                              : emailDeliveryFailureReason(item.reason)}
                            {summary.smsSupported
                              ? ` · ${smsDeliveryLabel(item.sms)}`
                              : ''}
                          </AppText>
                        </View>
                        <ChevronRight
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                      </View>
                    );
                  })}
                </View>
                <View
                  style={[
                    styles.sosDisclosureRow,
                    { backgroundColor: theme.colors.surface.raised },
                  ]}
                >
                  <FileText
                    size={sizes.icon.md}
                    color={theme.colors.icon.interactive}
                  />
                  <View style={styles.sosRecipientDetails}>
                    <AppText variant="label">
                      {sent > 0
                        ? 'Wealth register sent'
                        : 'Wealth register not sent'}
                    </AppText>
                    <AppText variant="caption" color="secondary">
                      {handoffCountLabel(
                        selectedHandoffTypes,
                        item =>
                          item.counts.assets +
                          item.counts.insurance +
                          item.counts.loans +
                          item.counts.financialRecords,
                        'entry',
                        'entries',
                      )}{' '}
                      ·{' '}
                      {handoffCountLabel(
                        selectedHandoffTypes,
                        item => item.counts.documents + item.counts.images,
                        'document',
                        'documents',
                      )}
                    </AppText>
                  </View>
                  <ChevronRight
                    size={sizes.icon.md}
                    color={theme.colors.icon.interactive}
                  />
                </View>
                <View
                  style={[
                    styles.sosWarning,
                    {
                      backgroundColor:
                        outcome === 'failed'
                          ? theme.colors.status.danger.surface
                          : theme.colors.surface.brandTint,
                    },
                  ]}
                >
                  <AppText variant="label" color="interactive">
                    Access and read status
                  </AppText>
                  <AppText variant="bodySm">
                    {sent > 0
                      ? 'Email accepted means the message was accepted for delivery, not that it was opened. The current service does not provide link expiry or revocation.'
                      : 'No email was accepted for delivery. If a delivery outcome is uncertain, check with recipients before retrying.'}
                  </AppText>
                </View>
                {sent > 0 ? (
                  <Button
                    title="Revoke handoff access"
                    variant="secondary"
                    onPress={() => setShowRevokeInfo(true)}
                  />
                ) : null}
              </ScrollView>
              <View
                style={[
                  styles.sosActions,
                  { borderTopColor: theme.colors.border.subtle },
                ]}
              >
                <Button title="Back to Wealth" onPress={onClose} />
              </View>
            </>
          ) : busy && summary ? (
            <>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sosContent}
              >
                <AppText variant="caption" color="interactive">
                  Step 3 of 3 · Sending handoff
                </AppText>
                <View
                  style={[
                    styles.sosIntro,
                    { backgroundColor: theme.colors.surface.brandTint },
                  ]}
                >
                  <AppText variant="label" color="interactive">
                    Sending secure access links…
                  </AppText>
                  <AppText variant="caption">
                    {formatHandoffDate(sendStartedAt)}
                  </AppText>
                </View>
                <View
                  style={[
                    styles.sosDisclosureRow,
                    { backgroundColor: theme.colors.surface.raised },
                  ]}
                >
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.status.success.text}
                  />
                  <View style={styles.sosRecipientDetails}>
                    <AppText variant="label">
                      Register snapshot being prepared
                    </AppText>
                    <AppText variant="caption" color="secondary">
                      {handoffCountLabel(
                        selectedHandoffTypes,
                        item =>
                          item.counts.assets +
                          item.counts.insurance +
                          item.counts.loans +
                          item.counts.financialRecords,
                        'entry',
                        'entries',
                      )}{' '}
                      ·{' '}
                      {handoffCountLabel(
                        selectedHandoffTypes,
                        item => item.counts.documents + item.counts.images,
                        'document',
                        'documents',
                      )}
                    </AppText>
                  </View>
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.icon.interactive}
                  />
                </View>
                <View style={styles.sosDisclosureGroup}>
                  {selectedRecipients.map(recipient => {
                    return (
                      <View
                        key={recipient.id}
                        style={[
                          styles.sosDisclosureRow,
                          { backgroundColor: theme.colors.surface.raised },
                        ]}
                      >
                        <ActivityIndicator
                          size="small"
                          color={theme.colors.icon.interactive}
                        />
                        <View style={styles.sosRecipientDetails}>
                          <AppText variant="label">{recipient.name}</AppText>
                          <AppText variant="caption" color="secondary">
                            Included in current send request · {recipient.email}
                          </AppText>
                        </View>
                        <ChevronRight
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                      </View>
                    );
                  })}
                </View>
                <AppText variant="bodySm" color="secondary">
                  You can return to Wealth. This request continues while the
                  screen is closed; reopen SOS handoff to view its results. Do
                  not start another handoff while this request is in progress.
                </AppText>
              </ScrollView>
              <View
                style={[
                  styles.sosActions,
                  { borderTopColor: theme.colors.border.subtle },
                ]}
              >
                <Button title="Back to Wealth" onPress={onClose} />
              </View>
            </>
          ) : summary ? (
            <>
              <ScrollView
                ref={contentScrollRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sosContent}
              >
                <AppText variant="caption" color="interactive">
                  {step === 'quiet-period-preview'
                    ? 'UI preview · Not scheduled'
                    : `Step ${
                        step === 'select'
                          ? '1 of 3 · Select trusted people'
                          : step === 'consent'
                            ? '2 of 3 · Understand what is shared'
                            : '3 of 3 · Review handoff'
                      }`}
                </AppText>
                {step === 'select' ? (
                  <>
                    <View
                      style={[
                        styles.sosIntro,
                        { backgroundColor: theme.colors.surface.brandTint },
                      ]}
                    >
                      <AppText variant="label" color="interactive">
                        Share when your family needs it
                      </AppText>
                      <AppText variant="bodySm">
                        Send a secure, read-only Wealth register with
                        attachments to the people you select.
                      </AppText>
                    </View>
                    <AppText variant="caption" color="secondary">
                      {summary.smsSupported
                        ? summary.smsConfigured
                          ? 'A short SOS SMS is also sent to selected people with a phone number. The documents are sent by email only.'
                          : 'SMS is not configured on the server. Email will still be attempted.'
                        : 'This server does not support SOS SMS yet. Email will still be attempted.'}
                    </AppText>
                    {summary.smsSupported && chosen.length > 10 ? (
                      <AppText variant="caption" color="danger">
                        Select at most 10 people for SMS.
                      </AppText>
                    ) : null}
                  </>
                ) : step === 'consent' ? (
                  <>
                    <View style={styles.sosDisclosureGroup}>
                      <View
                        style={[
                          styles.sosDisclosureRow,
                          { backgroundColor: theme.colors.surface.raised },
                        ]}
                      >
                        <CircleDollarSign
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                        <View style={styles.sosRecipientDetails}>
                          <AppText variant="label">
                            Your Wealth register
                          </AppText>
                          <AppText variant="caption" color="secondary">
                            {handoffCountLabel(
                              selectedHandoffTypes,
                              item =>
                                item.counts.assets +
                                item.counts.insurance +
                                item.counts.loans +
                                item.counts.financialRecords,
                              'entry',
                              'entries',
                            )}
                          </AppText>
                        </View>
                        <ChevronRight
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                      </View>
                      <View
                        style={[
                          styles.sosDisclosureRow,
                          { backgroundColor: theme.colors.surface.raised },
                        ]}
                      >
                        <FileText
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                        <View style={styles.sosRecipientDetails}>
                          <AppText variant="label">Attached documents</AppText>
                          <AppText variant="caption" color="secondary">
                            {handoffCountLabel(
                              selectedHandoffTypes,
                              item =>
                                item.counts.documents + item.counts.images,
                              'document',
                              'documents',
                            )}
                          </AppText>
                        </View>
                        <ChevronRight
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                      </View>
                      <View
                        style={[
                          styles.sosDisclosureRow,
                          { backgroundColor: theme.colors.surface.raised },
                        ]}
                      >
                        <ShieldCheck
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                        <View style={styles.sosRecipientDetails}>
                          <AppText variant="label">
                            Nominees and access notes
                          </AppText>
                          <AppText variant="caption" color="secondary">
                            Names, contact information and family instructions
                          </AppText>
                        </View>
                        <ChevronRight
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                      </View>
                    </View>
                    {includedContents.length > 0 ? (
                      <AppText variant="caption" color="secondary">
                        Included: {includedContents.join(' · ')}
                      </AppText>
                    ) : null}
                    {excludedContents.length > 0 ? (
                      <AppText variant="caption" color="secondary">
                        Not shared: {excludedContents.join(' · ')}
                      </AppText>
                    ) : null}
                    <View
                      style={[
                        styles.sosWarning,
                        {
                          backgroundColor: theme.colors.status.warning.surface,
                        },
                      ]}
                    >
                      <AppText
                        variant="label"
                        style={{ color: theme.colors.status.warning.text }}
                      >
                        This handoff sends immediately
                      </AppText>
                      <AppText variant="bodySm">
                        {quietPeriodError
                          ? 'The saved quiet-period preference could not be loaded. This handoff will send immediately.'
                          : `Your ${quietPeriod === 0 ? 'No wait' : `${quietPeriod}-hour`} quiet-period preference is stored on this device only and does not delay delivery.`}
                      </AppText>
                    </View>
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityLabel="Confirm immediate SOS handoff"
                      accessibilityState={{ checked: ack }}
                      onPress={() => setAck(value => !value)}
                      style={[
                        styles.sosConsentCard,
                        { backgroundColor: theme.colors.surface.raised },
                      ]}
                    >
                      <View style={styles.sosRecipientDetails}>
                        <AppText variant="label">
                          I consent to this handoff
                        </AppText>
                        <AppText variant="caption" color="secondary">
                          Share this register and its documents with{' '}
                          {selectedRecipientNames.join(', ')}.{' '}
                          {summary.smsSupported
                            ? summary.smsConfigured
                              ? 'An SOS SMS will also be attempted for recipients with a phone number.'
                              : 'SMS is not configured on the server.'
                            : 'Email will be used for delivery.'}
                        </AppText>
                      </View>
                      <View
                        style={[
                          styles.sosCheckbox,
                          {
                            borderColor: ack
                              ? theme.colors.border.interactive
                              : theme.colors.border.default,
                          },
                        ]}
                      >
                        {ack ? (
                          <Check
                            size={sizes.icon.sm}
                            color={theme.colors.text.interactive}
                          />
                        ) : null}
                      </View>
                    </Pressable>
                    <AppText variant="caption" color="secondary">
                      Recipients can download documents. Removing someone later
                      does not revoke a handoff already sent.
                    </AppText>
                  </>
                ) : step === 'quiet-period-preview' ? (
                  <>
                    <View
                      style={[
                        styles.sosWarning,
                        {
                          backgroundColor: theme.colors.status.warning.surface,
                        },
                      ]}
                    >
                      <AppText
                        variant="label"
                        style={{ color: theme.colors.status.warning.text }}
                      >
                        Preview only · no handoff is scheduled
                      </AppText>
                      <AppText variant="bodySm">
                        No links or documents have been sent. This screen is a
                        visual preview, not a live quiet period.
                      </AppText>
                    </View>
                    <AppText variant="overviewTitle">
                      {quietPeriod === 0
                        ? 'No wait selected'
                        : `${quietPeriod - 1}h 59m remaining`}
                    </AppText>
                    <AppText variant="caption" color="secondary">
                      Example countdown · not live
                    </AppText>
                    <View style={styles.sosDisclosureGroup}>
                      <View
                        style={[
                          styles.sosDisclosureRow,
                          { backgroundColor: theme.colors.surface.raised },
                        ]}
                      >
                        <Clock3
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                        <View style={styles.sosRecipientDetails}>
                          <AppText variant="label">
                            Scheduled-send preview
                          </AppText>
                          <AppText variant="caption" color="secondary">
                            {quietPeriod === 0
                              ? 'No wait is selected'
                              : `Example only · ${quietPeriod}-hour preference`}
                          </AppText>
                        </View>
                        <ChevronRight
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                      </View>
                      <View
                        style={[
                          styles.sosDisclosureRow,
                          { backgroundColor: theme.colors.surface.raised },
                        ]}
                      >
                        <Users
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                        <View style={styles.sosRecipientDetails}>
                          <AppText variant="label">
                            {recipientSummary(selectedRecipientNames)}
                          </AppText>
                          <AppText variant="caption" color="secondary">
                            {chosen.length}{' '}
                            {chosen.length === 1
                              ? 'verified email address'
                              : 'verified email addresses'}
                          </AppText>
                        </View>
                        <ChevronRight
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                      </View>
                      <View
                        style={[
                          styles.sosDisclosureRow,
                          { backgroundColor: theme.colors.surface.raised },
                        ]}
                      >
                        <FileText
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                        <View style={styles.sosRecipientDetails}>
                          <AppText variant="label">
                            Register snapshot preview
                          </AppText>
                          <AppText variant="caption" color="secondary">
                            No snapshot or email has been created
                          </AppText>
                        </View>
                        <ChevronRight
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                      </View>
                    </View>
                    <AppText variant="bodySm" color="secondary">
                      You can continue editing Wealth. Leaving this preview does
                      not create, cancel, or send a handoff.
                    </AppText>
                  </>
                ) : (
                  <>
                    <View style={styles.sosDisclosureGroup}>
                      <View
                        style={[
                          styles.sosDisclosureRow,
                          { backgroundColor: theme.colors.surface.raised },
                        ]}
                      >
                        <Users
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                        <View style={styles.sosRecipientDetails}>
                          <AppText variant="label">
                            {recipientSummary(selectedRecipientNames)}
                          </AppText>
                          <AppText variant="caption" color="secondary">
                            {chosen.length}{' '}
                            {chosen.length === 1
                              ? 'verified email address'
                              : 'verified email addresses'}
                          </AppText>
                        </View>
                        <ChevronRight
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                      </View>
                      <View
                        style={[
                          styles.sosDisclosureRow,
                          { backgroundColor: theme.colors.surface.raised },
                        ]}
                      >
                        <FileText
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                        <View style={styles.sosRecipientDetails}>
                          <AppText variant="label">
                            Wealth register +{' '}
                            {handoffCountLabel(
                              selectedHandoffTypes,
                              item =>
                                item.counts.documents + item.counts.images,
                              'document',
                              'documents',
                            )}
                          </AppText>
                          <AppText variant="caption" color="secondary">
                            Snapshot at time of sending ·{' '}
                            {handoffCountLabel(
                              selectedHandoffTypes,
                              item =>
                                item.counts.assets +
                                item.counts.insurance +
                                item.counts.loans +
                                item.counts.financialRecords,
                              'entry',
                              'entries',
                            )}
                          </AppText>
                        </View>
                        <ChevronRight
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                      </View>
                      <View
                        style={[
                          styles.sosDisclosureRow,
                          { backgroundColor: theme.colors.surface.raised },
                        ]}
                      >
                        <Clock3
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                        <View style={styles.sosRecipientDetails}>
                          <AppText variant="label">
                            Quiet period ·{' '}
                            {quietPeriod === 0
                              ? 'No wait'
                              : `${quietPeriod} hours`}
                          </AppText>
                          <AppText variant="caption" color="secondary">
                            Device-only preference · does not schedule delivery
                          </AppText>
                        </View>
                        <ChevronRight
                          size={sizes.icon.md}
                          color={theme.colors.icon.interactive}
                        />
                      </View>
                    </View>
                    <View
                      style={[
                        styles.sosWarning,
                        {
                          backgroundColor: theme.colors.status.warning.surface,
                        },
                      ]}
                    >
                      <AppText
                        variant="label"
                        style={{ color: theme.colors.status.warning.text }}
                      >
                        This handoff will send immediately
                      </AppText>
                      <AppText variant="bodySm">
                        The saved quiet-period preference does not delay this
                        release. Once sent, recipients may download the
                        documents.
                      </AppText>
                    </View>
                    <AppText variant="caption" color="secondary">
                      {summary.smsSupported
                        ? summary.smsConfigured
                          ? 'Email includes the Wealth register and documents. An SOS SMS is also attempted for recipients with a phone number.'
                          : 'Email includes the Wealth register and documents. SMS is not configured on the server.'
                        : 'Email includes the Wealth register and documents.'}
                    </AppText>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Preview quiet-period active screen"
                      onPress={() => setStep('quiet-period-preview')}
                      style={[
                        styles.sosDisclosureRow,
                        { backgroundColor: theme.colors.surface.raised },
                      ]}
                    >
                      <Clock3
                        size={sizes.icon.md}
                        color={theme.colors.icon.interactive}
                      />
                      <View style={styles.sosRecipientDetails}>
                        <AppText variant="label">
                          Preview quiet-period active screen
                        </AppText>
                        <AppText variant="caption" color="secondary">
                          UI preview only · nothing will be scheduled
                        </AppText>
                      </View>
                      <ChevronRight
                        size={sizes.icon.md}
                        color={theme.colors.icon.interactive}
                      />
                    </Pressable>
                  </>
                )}

                {step === 'select' && recipients.length ? (
                  <View style={styles.sosGroup}>
                    {recipients.map(recipient => {
                      const isSelected = chosen.includes(recipient.id);
                      const canSelect = canSelectRecipient(recipient);
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
                            disabled: !canSelect,
                          }}
                          disabled={!canSelect}
                          onPress={() => toggle(recipient)}
                          style={[
                            styles.sosRecipient,
                            {
                              borderColor: isSelected
                                ? theme.colors.border.interactive
                                : theme.colors.border.default,
                              backgroundColor: theme.colors.surface.raised,
                            },
                            !canSelect && styles.sosRecipientDisabled,
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
                            <AppText variant="label">
                              {recipient.name} ·{' '}
                              {humanizeLabel(recipient.relationship)}
                            </AppText>
                            <AppText variant="caption" color="secondary">
                              {recipient.email}
                              {canSelect
                                ? ' · Verified'
                                : recipient.type === 'other'
                                  ? ' · not available for SOS handoff'
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
                              },
                            ]}
                          >
                            {isSelected ? (
                              <Check
                                size={sizes.icon.sm}
                                color={theme.colors.text.interactive}
                              />
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : step === 'select' ? (
                  <View style={styles.sosGroup}>
                    <AppText color="secondary">
                      Nobody is set up to receive a handoff yet.
                    </AppText>
                  </View>
                ) : null}

                {step === 'select' && onManageTrustedPeople ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add a trusted person"
                    onPress={onManageTrustedPeople}
                    style={[
                      styles.sosAddPerson,
                      { borderColor: theme.colors.border.interactive },
                    ]}
                  >
                    <AppText
                      variant="action"
                      style={{ color: theme.colors.text.interactive }}
                    >
                      Add a trusted person
                    </AppText>
                    <ChevronRight
                      size={sizes.icon.sm}
                      color={theme.colors.icon.interactive}
                    />
                  </Pressable>
                ) : null}
                {step === 'select' ? (
                  <>
                    <AppText variant="label" color="interactive">
                      {chosen.length}{' '}
                      {chosen.length === 1 ? 'person' : 'people'} selected
                    </AppText>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Quiet period preference"
                      disabled={!onEditQuietPeriod}
                      onPress={onEditQuietPeriod}
                      style={[
                        styles.sosQuietRow,
                        { backgroundColor: theme.colors.surface.raised },
                      ]}
                    >
                      <Clock3
                        size={sizes.icon.md}
                        color={theme.colors.icon.interactive}
                      />
                      <View style={styles.sosRecipientDetails}>
                        <AppText variant="label">
                          Quiet period ·{' '}
                          {quietPeriod === 0
                            ? 'No wait'
                            : `${quietPeriod} hours`}
                        </AppText>
                        <AppText variant="caption" color="secondary">
                          {quietPeriodError
                            ? quietPeriodError
                            : 'Device-only setting · SOS sends immediately'}
                        </AppText>
                      </View>
                      <ChevronRight
                        size={sizes.icon.md}
                        color={theme.colors.icon.interactive}
                      />
                    </Pressable>
                  </>
                ) : null}
              </ScrollView>

              <View
                style={[
                  styles.sosActions,
                  { borderTopColor: theme.colors.border.subtle },
                ]}
              >
                {step === 'select' ? (
                  <>
                    <Button
                      title={`Continue with ${chosen.length} ${
                        chosen.length === 1 ? 'person' : 'people'
                      }`}
                      disabled={!canContinue}
                      onPress={() => setStep('consent')}
                    />
                    <Button
                      title="Cancel handoff"
                      variant="secondary"
                      onPress={onClose}
                    />
                  </>
                ) : step === 'consent' ? (
                  <>
                    <Button
                      title="Review handoff"
                      disabled={!canReview}
                      onPress={() => setStep('review')}
                    />
                    <Button
                      title="Back"
                      variant="secondary"
                      onPress={() => {
                        setAck(false);
                        setStep('select');
                      }}
                    />
                  </>
                ) : step === 'quiet-period-preview' ? (
                  <>
                    <Button title="Back to Wealth" onPress={onClose} />
                    <Button
                      title="Return to review"
                      variant="secondary"
                      onPress={() => setStep('review')}
                    />
                  </>
                ) : (
                  <>
                    <Button
                      title={busy ? 'Sending…' : 'Release handoff now'}
                      variant="danger"
                      disabled={!canSend}
                      onPress={release}
                    />
                    <Button
                      title="Back to consent"
                      variant="secondary"
                      disabled={busy}
                      onPress={() => setStep('consent')}
                    />
                  </>
                )}
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  hidden: { display: 'none' },

  sosScreen: {
    flex: 1,
  },

  sosPanel: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },

  sosCloseButton: {
    minWidth: sizes.minimumTouchTarget,
    minHeight: sizes.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sosFamilyContext: {
    minHeight: 23,
    paddingHorizontal: 4,
  },

  sosIntro: {
    padding: 12,
    borderRadius: radius.surface,
    gap: space[4],
  },

  sosContent: {
    gap: 16,
    paddingTop: 12,
    paddingBottom: 20,
    flexGrow: 1,
  },

  sosAddPerson: {
    minHeight: sizes.button.sm,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radius.control,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  sosQuietRow: {
    minHeight: sizes.listRow,
    padding: 12,
    borderRadius: radius.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },

  sosWarning: {
    padding: 12,
    borderRadius: radius.surface,
    gap: space[4],
  },

  sosDisclosureGroup: {
    gap: space[8],
  },

  sosDisclosureRow: {
    minHeight: sizes.listRow,
    padding: 12,
    borderRadius: radius.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },

  sosConsentCard: {
    minHeight: sizes.listRow,
    padding: 12,
    borderRadius: radius.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },

  sosReviewRecipient: {
    minHeight: sizes.listRow,
    padding: 12,
    borderRadius: radius.surface,
    gap: space[4],
  },

  sosGroup: {
    gap: 8,
  },

  sosRecipient: {
    minHeight: sizes.listRow,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 12,
  },

  sosRecipientDisabled: {
    opacity: 0.55,
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

  sosActions: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  screenContent: {
    paddingHorizontal: 0,
  },

  emptyOverviewScreenContent: {
    paddingBottom: 152,
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

  headerButton: {
    width: sizes.minimumTouchTarget,
    height: sizes.minimumTouchTarget,
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
    gap: 4,
    borderRadius: radius.tile,
    borderWidth: 0,
  },

  progressTrack: {
    height: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },

  readinessActions: {
    marginTop: 2,
  },

  readinessExplainAction: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radius.control,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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

  /* Required wealth groups */

  groupCard: {
    gap: 8,
  },

  groupHeader: {
    paddingHorizontal: 0,
  },

  groupRows: {
    gap: 8,
  },

  recordCard: {
    minHeight: 60,
    borderRadius: radius.surface,
    overflow: 'hidden',
    justifyContent: 'center',
  },

  overviewRow: {
    minHeight: 60,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  recordSummary: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },

  recordTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  viewAllAction: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: radius.control,
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
