import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Trash2,
} from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { WealthRecord } from '../../api/wealth.api';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { Card } from '../../components/primitives/Card';
import { Row } from '../../components/primitives/Row';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import { layout, space, spacing } from '../../design/tokens/spacing';
import { formatDate } from '../../utils/format';

type Props = {
  visible: boolean;
  records: WealthRecord[];
  userName?: string;
  onClose: () => void;
  onAdd: () => void;
  onDelete: (record: WealthRecord) => void;
  onEdit: (record: WealthRecord) => void;
  onSettle: (record: WealthRecord) => Promise<WealthRecord>;
};

function detailValue(record: WealthRecord, keys: string[]) {
  for (const key of keys) {
    const value = record.details[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return '';
}

function isSettled(record: WealthRecord) {
  const status = String(record.details.status ?? '').toLowerCase();
  return status === 'settled';
}

function amount(record: WealthRecord) {
  const raw = detailValue(record, [
    'outstanding',
    'amount',
    'principalAmount',
    'principal',
  ]);
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function currency(record: WealthRecord) {
  return detailValue(record, ['currency']) || 'INR';
}

function formatAmount(value: number, currencyCode: string) {
  return currencyCode.toUpperCase() === 'INR'
    ? `₹${value.toLocaleString('en-IN')}`
    : `${currencyCode.toUpperCase()} ${value.toLocaleString('en-IN')}`;
}

function formatTotals(records: WealthRecord[]) {
  const totals = new Map<string, number>();
  records.forEach(record => {
    const code = currency(record).toUpperCase();
    totals.set(code, (totals.get(code) ?? 0) + amount(record));
  });
  return (
    [...totals.entries()]
      .map(([code, value]) => formatAmount(value, code))
      .join(' · ') || formatAmount(0, 'INR')
  );
}

function transactionDate(record: WealthRecord) {
  return (
    detailValue(record, ['transactionDate', 'date', 'lentOn', 'borrowedOn']) ||
    record.createdAt
  );
}

function followUpDate(record: WealthRecord) {
  return (
    detailValue(record, [
      'followUpOn',
      'dueDate',
      'repaymentDate',
      'maturityDate',
    ]) ||
    record.followUpDate ||
    ''
  );
}

function counterparty(record: WealthRecord) {
  return (
    detailValue(record, [
      'counterparty',
      'borrower',
      'lender',
      'who',
      'party',
      'paidTo',
      'receivedFrom',
    ]) || 'Person not specified'
  );
}

function transactionTitle(record: WealthRecord) {
  const person = counterparty(record);
  return record.type === 'LOAN_GIVEN'
    ? `Lent to ${person}`
    : `Borrowed from ${person}`;
}

function TransactionRow({
  record,
  onPress,
  onDelete,
}: {
  record: WealthRecord;
  onPress: () => void;
  onDelete: () => void;
}) {
  const { theme } = useAppTheme();
  const settled = isSettled(record);
  const primaryDate = formatDate(transactionDate(record));
  const secondaryDate = formatDate(followUpDate(record));
  const dateRange = [primaryDate, secondaryDate].filter(Boolean).join(' → ');
  const evidence = record.attachments.length
    ? settled
      ? 'Receipt attached'
      : 'Evidence attached'
    : 'No evidence attached';
  const status = settled
    ? `Settled${primaryDate ? ` ${primaryDate}` : ''} · ${evidence}`
    : `${dateRange || 'Date not recorded'} · ${evidence}`;
  const amountLabel = formatAmount(amount(record), currency(record));
  const Icon = settled ? CheckCircle2 : CircleDollarSign;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${transactionTitle(record)} details`}
      onPress={onPress}
    >
      <Card style={styles.transactionCard}>
        <Icon
          size={sizes.icon.md}
          color={
            settled
              ? theme.colors.status.success.icon
              : theme.colors.icon.interactive
          }
          strokeWidth={2}
        />
        <View style={styles.transactionCopy}>
          <AppText variant="listTitle" numberOfLines={1}>
            {transactionTitle(record)}
          </AppText>
          <AppText variant="bodySm" color="secondary" numberOfLines={2}>
            {status}
          </AppText>
        </View>
        <AppText variant="label" color="interactive">
          {amountLabel}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete ${transactionTitle(record)}`}
          hitSlop={8}
          onPress={event => {
            event.stopPropagation();
            onDelete();
          }}
          style={styles.deleteButton}
        >
          <Trash2 size={sizes.icon.sm} color={theme.colors.icon.secondary} />
        </Pressable>
        <ChevronRight
          size={sizes.icon.md}
          color={theme.colors.icon.interactive}
        />
      </Card>
    </Pressable>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.detailLine}>
      <AppText variant="bodySm" color="secondary">
        {label}
      </AppText>
      <AppText variant="bodySm" style={{ color: theme.colors.text.primary }}>
        {value || 'Not added yet'}
      </AppText>
    </View>
  );
}

export function LentBorrowedScreen({
  visible,
  records,
  userName,
  onClose,
  onAdd,
  onDelete,
  onEdit,
  onSettle,
}: Props) {
  const { theme } = useAppTheme();
  const [selectedId, setSelectedId] = useState<string>();
  const [settling, setSettling] = useState(false);
  const [settleError, setSettleError] = useState<string>();
  useEffect(() => {
    if (!visible) setSelectedId(undefined);
  }, [visible]);
  const active = records.filter(record => !isSettled(record));
  const settled = records.filter(isSettled);
  const activeLent = active.filter(record => record.type === 'LOAN_GIVEN');
  const activeBorrowed = active.filter(record => record.type === 'LOAN_TAKEN');
  const selected = records.find(record => record.id === selectedId);

  const markSettled = async () => {
    if (!selected) return;
    setSettling(true);
    setSettleError(undefined);
    try {
      const updated = await onSettle(selected);
      setSelectedId(updated.id);
    } catch (error) {
      setSettleError(
        error instanceof Error
          ? error.message
          : 'Unable to settle transaction.',
      );
    } finally {
      setSettling(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <Screen scroll padded={false} contentContainerStyle={styles.content}>
          {selected ? (
            <>
              <Row align="center" gap="sm" style={styles.header}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to lent and borrowed"
                  hitSlop={8}
                  onPress={() => {
                    setSettleError(undefined);
                    setSelectedId(undefined);
                  }}
                  style={styles.back}
                >
                  <ChevronLeft
                    size={sizes.icon.md}
                    color={theme.colors.icon.interactive}
                  />
                </Pressable>
                <AppText variant="overviewTitle" numberOfLines={1}>
                  {transactionTitle(selected)}
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
                  Family wealth register
                </AppText>
              </Row>

              <Card style={styles.detailSummary}>
                <AppText variant="overviewTitle">
                  {formatAmount(amount(selected), currency(selected))}
                </AppText>
                <AppText variant="bodySm" color="secondary">
                  {isSettled(selected)
                    ? 'Settled'
                    : `Unsettled${followUpDate(selected) ? ` · Due ${formatDate(followUpDate(selected))}` : ''}`}
                </AppText>
                <AppText variant="bodySm">
                  {selected.type === 'LOAN_GIVEN'
                    ? `Money lent to ${counterparty(selected)}`
                    : `Money borrowed from ${counterparty(selected)}`}
                  {detailValue(selected, ['whatFor'])
                    ? ` for ${detailValue(selected, ['whatFor'])}`
                    : ''}
                </AppText>
              </Card>

              <Card style={styles.detailCard}>
                <AppText variant="label">Transaction details</AppText>
                <DetailLine
                  label={
                    selected.type === 'LOAN_GIVEN'
                      ? 'Date lent'
                      : 'Date borrowed'
                  }
                  value={formatDate(transactionDate(selected))}
                />
                <DetailLine
                  label="Due date"
                  value={formatDate(followUpDate(selected))}
                />
                <DetailLine
                  label="Person"
                  value={
                    detailValue(selected, [
                      'counterparty',
                      'who',
                      'party',
                      'paidTo',
                      'receivedFrom',
                      'borrower',
                      'lender',
                    ]) || 'Person not specified'
                  }
                />
                <DetailLine
                  label="Phone"
                  value={detailValue(selected, [
                    'counterpartyPhone',
                    'phone',
                    'phoneNumber',
                  ])}
                />
                <DetailLine
                  label="Email"
                  value={detailValue(selected, ['counterpartyEmail', 'email'])}
                />
                <DetailLine
                  label="Payment method"
                  value={detailValue(selected, ['paymentMethod'])}
                />
                <DetailLine
                  label="Payment reference"
                  value={detailValue(selected, [
                    'paymentReference',
                    'paymentRef',
                    'transactionReference',
                    'upiReference',
                  ])}
                />
              </Card>

              <Card style={styles.detailCard}>
                <AppText variant="label">Evidence</AppText>
                {selected.attachments.length ? (
                  selected.attachments.map(attachment => (
                    <AppText key={attachment.id} variant="bodySm">
                      {attachment.title || attachment.originalName}
                    </AppText>
                  ))
                ) : (
                  <AppText variant="bodySm" color="secondary">
                    No evidence attached.
                  </AppText>
                )}
              </Card>

              <Card
                style={[
                  styles.familyNote,
                  { backgroundColor: theme.colors.surface.brandTint },
                ]}
              >
                <AppText variant="label" color="interactive">
                  Family access note
                </AppText>
                <AppText variant="bodySm">
                  {selected.followUpNote ||
                    selected.notes ||
                    'No family note added.'}
                </AppText>
              </Card>

              {settleError ? (
                <AppText variant="caption" color="danger">
                  {settleError}
                </AppText>
              ) : null}
              {!isSettled(selected) ? (
                <Button
                  title={settling ? 'Saving…' : 'Mark as settled'}
                  disabled={settling}
                  onPress={markSettled}
                />
              ) : null}
              <Button
                title="Edit transaction"
                variant="secondary"
                onPress={() => onEdit(selected)}
              />
            </>
          ) : (
            <>
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
                <AppText variant="overviewTitle">Lent and borrowed</AppText>
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

              <Card style={styles.summaryCard}>
                <Row align="center" justify="space-between">
                  <AppText variant="bodySm" color="secondary">
                    You are owed
                  </AppText>
                  <AppText variant="label">{formatTotals(activeLent)}</AppText>
                </Row>
                <Row align="center" justify="space-between">
                  <AppText variant="bodySm" color="secondary">
                    You owe
                  </AppText>
                  <AppText variant="label">
                    {formatTotals(activeBorrowed)}
                  </AppText>
                </Row>
              </Card>

              <AppText variant="label" color="interactive">
                Active {active.length} · Settled {settled.length}
              </AppText>

              <Stack gap="sm">
                {active.length ? (
                  active.map(record => (
                    <TransactionRow
                      key={record.id}
                      record={record}
                      onPress={() => setSelectedId(record.id)}
                      onDelete={() => onDelete(record)}
                    />
                  ))
                ) : (
                  <AppText variant="bodySm" color="secondary">
                    No active transactions.
                  </AppText>
                )}
              </Stack>

              {settled.length ? (
                <>
                  <AppText variant="heading">Settled</AppText>
                  <Stack gap="sm">
                    {settled.map(record => (
                      <TransactionRow
                        key={record.id}
                        record={record}
                        onPress={() => setSelectedId(record.id)}
                        onDelete={() => onDelete(record)}
                      />
                    ))}
                  </Stack>
                </>
              ) : null}

              <Card
                style={[
                  styles.tipCard,
                  { backgroundColor: theme.colors.surface.brandTint },
                ]}
              >
                <AppText variant="label" color="interactive">
                  Keep informal agreements clear
                </AppText>
                <AppText variant="bodySm">
                  Record the person, amount, due date and evidence.
                </AppText>
              </Card>

              <Button title="Add transaction" onPress={onAdd} />
            </>
          )}
        </Screen>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { padding: layout.gutter, gap: spacing.md },
  header: { minHeight: sizes.minimumTouchTarget },
  back: {
    width: sizes.minimumTouchTarget,
    height: sizes.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyContext: { minHeight: sizes.minimumTouchTarget },
  summaryCard: {
    padding: space[12],
    borderRadius: radius.surface,
    gap: spacing.sm,
  },
  detailSummary: {
    padding: space[16],
    borderRadius: radius.surface,
    gap: spacing.sm,
  },
  detailCard: {
    padding: space[16],
    borderRadius: radius.surface,
    gap: spacing.sm,
  },
  detailLine: {
    gap: space[2],
    paddingVertical: space[4],
  },
  familyNote: {
    padding: space[16],
    borderRadius: radius.surface,
    gap: spacing.sm,
  },
  transactionCard: {
    minHeight: 75,
    padding: space[12],
    borderRadius: radius.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  transactionCopy: { flex: 1, minWidth: 0, gap: space[2] },
  deleteButton: {
    width: sizes.minimumTouchTarget,
    height: sizes.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipCard: {
    padding: space[12],
    borderRadius: radius.surface,
    gap: space[4],
  },
});
