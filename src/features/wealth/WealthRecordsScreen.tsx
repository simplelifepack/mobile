import React from 'react';
import {
  AlertCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Landmark,
  ShieldCheck,
} from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { WealthRecord } from '../../api/wealth.api';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { Card } from '../../components/primitives/Card';
import { Row } from '../../components/primitives/Row';
import { Screen } from '../../components/primitives/Screen';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import { layout, space, spacing } from '../../design/tokens/spacing';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { formatDate } from '../../utils/format';
import { recordReadinessGaps } from './wealthReadiness';
import { WealthAccountDetails } from './WealthAccountDetails';

export type WealthRecordScreenKind = 'accounts' | 'insurance' | 'loans';

type Props = {
  visible: boolean;
  kind: WealthRecordScreenKind;
  records: WealthRecord[];
  userName?: string;
  profileNames: ReadonlyMap<string, string>;
  onClose: () => void;
  onAdd: () => void;
  onEdit: (record: WealthRecord) => void;
  onEditAccessNote?: (record: WealthRecord) => void;
};

const screenCopy: Record<
  WealthRecordScreenKind,
  {
    title: string;
    backLabel: string;
    emptyMessage: string;
    readyMessage: string;
    addLabel: string;
  }
> = {
  accounts: {
    title: 'Accounts and investments',
    backLabel: 'Back to accounts and investments',
    emptyMessage: 'No accounts or investments added yet.',
    readyMessage:
      'All accounts and investments have the details your family needs.',
    addLabel: 'Add account or investment',
  },
  insurance: {
    title: 'Insurance',
    backLabel: 'Back to insurance',
    emptyMessage: 'No insurance policies added yet.',
    readyMessage: 'All insurance policies have the details your family needs.',
    addLabel: 'Add insurance policy',
  },
  loans: {
    title: 'Loans',
    backLabel: 'Back to loans',
    emptyMessage: 'No loans added yet.',
    readyMessage: 'All loans have the details your family needs.',
    addLabel: 'Add loan',
  },
};

function recordSubtitle(
  record: WealthRecord,
  userName: string | undefined,
  profileNames: ReadonlyMap<string, string>,
) {
  const memberId = String(record.details.memberId ?? '');
  const owner =
    String(record.details.ownerName ?? record.details.memberName ?? '') ||
    (memberId === 'you'
      ? userName || 'You'
      : profileNames.get(memberId) || 'You');
  const gaps = recordReadinessGaps(record);
  if (gaps.length) {
    return `${owner} · Missing ${gaps.length} ${gaps.length === 1 ? 'detail' : 'details'}`;
  }
  const dateKeys =
    record.type === 'INSURANCE'
      ? ['renewalDate', 'expiryDate', 'validUntil', 'validTill']
      : record.type === 'LOAN_GIVEN' || record.type === 'LOAN_TAKEN'
        ? ['dueDate', 'maturityDate']
        : ['maturityDate'];
  const date = dateKeys
    .map(key => record.details[key])
    .find(
      (value): value is string => typeof value === 'string' && Boolean(value),
    );
  if (date) {
    const dateLabel =
      record.type === 'INSURANCE'
        ? 'Renews'
        : record.type === 'LOAN_GIVEN' || record.type === 'LOAN_TAKEN'
          ? 'Due'
          : 'Matures';
    return `${owner} · ${dateLabel} ${formatDate(date)}`;
  }
  return `${owner} · Updated ${formatDate(record.updatedAt)}`;
}

function statusMessage(record: WealthRecord) {
  const gaps = recordReadinessGaps(record);
  if (!gaps.length) return undefined;
  const labels = gaps.map(gap => {
    if (gap === 'No document') return 'a document';
    if (gap === 'No access note') return 'family access note';
    if (gap === 'No nominee') return 'nominee information';
    if (gap === 'Owner or reference missing')
      return 'owner or reference information';
    if (gap === 'Value or amount missing') return 'a value or amount';
    return gap.toLowerCase();
  });
  return `${record.title} needs ${labels.join(' and ')}.`;
}

function formatMoney(value: number) {
  const amount = Math.abs(value);
  if (!Number.isFinite(value)) return '₹0';
  if (amount >= 10_000_000)
    return `₹${(value / 10_000_000).toFixed(amount % 10_000_000 === 0 ? 0 : 1)}Cr`;
  if (amount >= 100_000)
    return `₹${(value / 100_000).toFixed(amount % 100_000 === 0 ? 0 : 1)}L`;
  if (amount >= 1_000) return `₹${Math.round(value / 1_000)}K`;
  return `₹${value.toLocaleString('en-IN')}`;
}

export function WealthRecordsScreen({
  visible,
  kind,
  records,
  userName,
  profileNames,
  onClose,
  onAdd,
  onEdit,
  onEditAccessNote = onEdit,
}: Props) {
  const { theme } = useAppTheme();
  const copy = screenCopy[kind];
  const [selectedRecord, setSelectedRecord] = React.useState<WealthRecord>();
  React.useEffect(() => {
    if (!selectedRecord) return;
    const updatedRecord = records.find(
      record => record.id === selectedRecord.id,
    );
    if (updatedRecord && updatedRecord !== selectedRecord) {
      setSelectedRecord(updatedRecord);
    }
  }, [records, selectedRecord]);
  const readyCount = records.filter(
    record => recordReadinessGaps(record).length === 0,
  ).length;
  const incomplete = records.find(
    record => recordReadinessGaps(record).length > 0,
  );
  const isLow = incomplete !== undefined;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {
        if (selectedRecord) setSelectedRecord(undefined);
        else onClose();
      }}
    >
      <SafeAreaProvider>
        {selectedRecord ? (
          <WealthAccountDetails
            record={selectedRecord}
            userName={userName}
            profileNames={profileNames}
            backLabel={copy.backLabel}
            onBack={() => setSelectedRecord(undefined)}
            onBackToWealth={onClose}
            onEdit={() => {
              const record = selectedRecord;
              setSelectedRecord(undefined);
              onEdit(record);
            }}
            onEditAccessNote={() => onEditAccessNote(selectedRecord)}
          />
        ) : (
          <Screen scroll padded={false} contentContainerStyle={styles.content}>
            <Row align="center" gap="sm" style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to Wealth"
                hitSlop={8}
                onPress={onClose}
                style={styles.back}
              >
                <ChevronLeft
                  size={sizes.icon.md}
                  color={theme.colors.icon.interactive}
                />
              </Pressable>
              <AppText variant="overviewTitle">{copy.title}</AppText>
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
                Family wealth register
              </AppText>
            </Row>

            <Card
              style={[
                styles.readiness,
                {
                  backgroundColor: isLow
                    ? theme.colors.status.warning.surface
                    : theme.colors.surface.brandTint,
                },
              ]}
            >
              <AppText
                variant="label"
                style={{
                  color: isLow
                    ? theme.colors.status.warning.text
                    : theme.colors.text.interactive,
                }}
              >
                {readyCount} of {records.length} ready
              </AppText>
              <AppText variant="bodySm">
                {incomplete ? statusMessage(incomplete) : copy.readyMessage}
              </AppText>
            </Card>

            <View style={styles.records}>
              {records.map(record => {
                const gaps = recordReadinessGaps(record);
                const Icon = gaps.length
                  ? AlertCircle
                  : record.type === 'INSURANCE'
                    ? ShieldCheck
                    : record.type === 'LOAN_GIVEN' ||
                        record.type === 'LOAN_TAKEN'
                      ? Landmark
                      : /account|deposit|savings|current|checking/i.test(
                            `${record.details.assetType ?? ''} ${record.title}`,
                          )
                        ? Building2
                        : Landmark;
                const amount =
                  record.type === 'INSURANCE'
                    ? (record.details.coverageAmount ??
                      record.details.sumAssured ??
                      record.details.coverAmount ??
                      record.details.amount)
                    : record.type === 'LOAN_GIVEN' ||
                        record.type === 'LOAN_TAKEN'
                      ? (record.details.outstanding ??
                        record.details.amount ??
                        record.details.principalAmount ??
                        record.details.principal)
                      : (record.details.value ??
                        record.details.amount ??
                        record.details.marketValue);
                return (
                  <Pressable
                    key={record.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${record.title}. ${recordSubtitle(record, userName, profileNames)}. ${formatMoney(Number(amount ?? 0))}`}
                    onPress={() => setSelectedRecord(record)}
                    style={({ pressed }) => [
                      styles.recordCard,
                      { backgroundColor: theme.colors.surface.raised },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Icon
                      size={sizes.icon.md}
                      color={
                        gaps.length
                          ? theme.colors.status.warning.icon
                          : theme.colors.icon.interactive
                      }
                      strokeWidth={2}
                    />
                    <View style={styles.recordCopy}>
                      <AppText variant="label" numberOfLines={1}>
                        {record.title}
                      </AppText>
                      <AppText
                        variant="bodySm"
                        color="secondary"
                        numberOfLines={1}
                      >
                        {recordSubtitle(record, userName, profileNames)}
                      </AppText>
                    </View>
                    <AppText variant="amount" color="interactive">
                      {formatMoney(Number(amount ?? 0))}
                    </AppText>
                    <ChevronRight
                      size={sizes.icon.md}
                      color={theme.colors.icon.interactive}
                    />
                  </Pressable>
                );
              })}
            </View>

            <AppText variant="bodySm" color="secondary">
              Showing all {records.length} entries
            </AppText>
            {records.length === 0 ? (
              <AppText variant="bodySm" color="secondary">
                {copy.emptyMessage}
              </AppText>
            ) : null}
            <Button title={copy.addLabel} onPress={onAdd} />
          </Screen>
        )}
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: sizes.minimumTouchTarget },
  back: {
    width: sizes.minimumTouchTarget,
    height: sizes.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyContext: { minHeight: sizes.minimumTouchTarget },
  content: { padding: layout.gutter, gap: spacing.md },
  readiness: { padding: space[12], borderRadius: radius.tile, gap: space[4] },
  records: { gap: spacing.sm },
  recordCard: {
    minHeight: 60,
    padding: space[12],
    borderRadius: radius.tile,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recordCopy: { flex: 1, gap: space[4] },
  pressed: { opacity: 0.8 },
});
