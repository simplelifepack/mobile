import React from 'react';
import {
  CircleHelp,
  ChevronLeft,
  ChevronRight,
  FileText,
  NotebookText,
  UserRound,
} from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { WealthRecord } from '../../api/wealth.api';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { Card } from '../../components/primitives/Card';
import { Row } from '../../components/primitives/Row';
import { Screen } from '../../components/primitives/Screen';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import { layout, space, spacing } from '../../design/tokens/spacing';
import { formatDate } from '../../utils/format';

type Props = {
  record: WealthRecord;
  userName?: string;
  profileNames: ReadonlyMap<string, string>;
  backLabel?: string;
  onBack: () => void;
  onBackToWealth: () => void;
  onEdit: () => void;
  onEditAccessNote?: () => void;
};

function detailValue(record: WealthRecord, keys: string[]) {
  for (const key of keys) {
    const value = record.details[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
    if (Array.isArray(value)) {
      const values = value.filter(
        (item): item is string =>
          typeof item === 'string' && Boolean(item.trim()),
      );
      if (values.length) return values.join(', ');
    }
  }
  return '';
}

function maskReference(value: string) {
  const suffix = value.replace(/[^a-z\d]/gi, '').slice(-4);
  return suffix ? `•••• ${suffix}` : 'Not added yet';
}

function formatAmount(value: string, currency: string) {
  if (!value) return 'Not added yet';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Not added yet';
  if (!currency || currency.toUpperCase() === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `${currency.toUpperCase()} ${amount.toLocaleString('en-IN')}`;
}

function formatCurrencyAmount(value: string, currency: string, suffix = '') {
  const amount = formatAmount(value, currency);
  if (amount === 'Not added yet') {
    return value.trim() ? `${value.trim()}${suffix}` : amount;
  }
  return `${amount}${suffix}`;
}

function titleCase(value: string) {
  const normalized = value.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return normalized ? normalized[0].toUpperCase() + normalized.slice(1) : '';
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Row
      align="center"
      justify="space-between"
      gap="sm"
      style={styles.detailRow}
    >
      <AppText variant="bodySm" color="secondary" style={styles.detailLabel}>
        {label}
      </AppText>
      <AppText variant="label" align="right" style={styles.detailValue}>
        {value}
      </AppText>
    </Row>
  );
}

type WealthRecordDetailsModalProps = {
  visible: boolean;
  record?: WealthRecord;
  userName?: string;
  profileNames: ReadonlyMap<string, string>;
  onClose: () => void;
  onEdit: (record: WealthRecord) => void;
  onEditAccessNote: (record: WealthRecord) => void;
};

export function WealthRecordDetailsModal({
  visible,
  record,
  userName,
  profileNames,
  onClose,
  onEdit,
  onEditAccessNote,
}: WealthRecordDetailsModalProps) {
  return (
    <Modal
      visible={visible && Boolean(record)}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      {record ? (
        <SafeAreaProvider>
          <WealthAccountDetails
            record={record}
            userName={userName}
            profileNames={profileNames}
            backLabel="Back to Wealth"
            onBack={onClose}
            onBackToWealth={onClose}
            onEdit={() => onEdit(record)}
            onEditAccessNote={() => onEditAccessNote(record)}
          />
        </SafeAreaProvider>
      ) : null}
    </Modal>
  );
}

export function WealthAccountDetails({
  record,
  userName,
  profileNames,
  backLabel = 'Back to Wealth',
  onBack,
  onBackToWealth,
  onEdit,
  onEditAccessNote = onEdit,
}: Props) {
  const { theme } = useAppTheme();
  const isInsurance = record.type === 'INSURANCE';
  const isLoan = record.type === 'LOAN_GIVEN' || record.type === 'LOAN_TAKEN';
  const isInformalLoan = record.details.recordKind === 'money_lent_borrowed';
  const assetType = detailValue(record, ['assetType', 'type', 'subtype']);
  const isAccount =
    record.type === 'ASSET' &&
    /account|deposit|savings|current|checking/i.test(
      `${assetType} ${record.title}`,
    );
  const detailTitle = isInsurance
    ? 'Insurance details'
    : isLoan
      ? 'Loan details'
      : isAccount
        ? 'Account details'
        : 'Investment details';
  const categoryLabel = isInsurance
    ? 'Insurance type'
    : isLoan
      ? 'Loan type'
      : isAccount
        ? 'Account type'
        : 'Investment type';
  const categoryKeys = isInsurance
    ? ['insuranceType', 'policyType', 'type', 'subtype']
    : isLoan
      ? ['loanType', 'loanCategory', 'type', 'subtype']
      : isAccount
        ? ['accountType', 'assetType', 'type', 'subtype']
        : ['investmentType', 'assetType', 'type', 'subtype'];
  const categoryValue =
    detailValue(record, categoryKeys) ||
    (isInformalLoan
      ? 'Informal loan'
      : isLoan
        ? 'Loan'
        : isInsurance
          ? 'Insurance policy'
          : 'Not added yet');
  const memberId = detailValue(record, ['memberId']);
  const owner =
    detailValue(record, ['ownerName', 'memberName']) ||
    (memberId === 'you'
      ? userName || 'You'
      : profileNames.get(memberId) || 'You');
  const referenceKeys = isInsurance
    ? ['policyNumber', 'accountRef', 'referenceNumber']
    : isLoan
      ? ['loanAccountNumber', 'accountRef', 'referenceNumber', 'accountNumber']
      : [
          'accountRef',
          'accountNumber',
          'accountNumberMasked',
          'referenceNumber',
        ];
  const reference = detailValue(record, referenceKeys);
  const bankKeys = isInsurance
    ? ['insurerName', 'provider', 'institution']
    : isLoan
      ? ['institution', 'lenderName', 'provider']
      : ['institution', 'provider', 'bankName', 'bank'];
  const institutionLabel = isInsurance
    ? 'Insurer'
    : isLoan
      ? record.type === 'LOAN_TAKEN'
        ? 'Lender'
        : 'Financial institution'
      : isAccount
        ? 'Bank / branch'
        : 'Platform / institution';
  const bank = detailValue(record, bankKeys);
  const branch = isAccount ? detailValue(record, ['branchName', 'branch']) : '';
  const institution = [bank, branch].filter(Boolean).join(' · ');
  const amountKeys = isInsurance
    ? ['coverageAmount', 'sumAssured', 'coverAmount', 'amount']
    : isLoan
      ? ['outstanding', 'amount', 'principalAmount', 'principal']
      : isAccount
        ? ['balance', 'currentBalance', 'value', 'amount', 'marketValue']
        : ['marketValue', 'value', 'amount'];
  const amount = detailValue(record, amountKeys);
  const currency = detailValue(record, ['currency']) || 'INR';
  const amountLabel = isInsurance
    ? 'Cover amount'
    : isLoan
      ? record.type === 'LOAN_TAKEN'
        ? 'Outstanding balance'
        : 'Amount owed to you'
      : isAccount
        ? 'Account balance'
        : 'Investment value';
  const dateLabel = isInsurance
    ? 'Renewal date'
    : isLoan
      ? isInformalLoan
        ? 'Follow-up date'
        : 'Maturity date'
      : isAccount
        ? 'As of'
        : 'Maturity / as of';
  const dateValue = isInsurance
    ? detailValue(record, [
        'renewalDate',
        'expiryDate',
        'validUntil',
        'validTill',
      ])
    : isLoan
      ? detailValue(record, ['maturityDate', 'dueDate', 'followUpDate']) ||
        record.followUpDate ||
        ''
      : isAccount
        ? detailValue(record, ['asOf', 'balanceDate']) || record.updatedAt
        : detailValue(record, ['maturityDate', 'asOf', 'balanceDate']) ||
          record.updatedAt;
  const formattedDate = formatDate(dateValue);
  const renewalDate = detailValue(record, [
    'renewalDate',
    'nextPremiumDate',
    'nextPaymentDate',
    'expiryDate',
    'validUntil',
    'validTill',
  ]);
  const nextEmiDate = detailValue(record, [
    'nextEmiDate',
    'nextEMIDate',
    'nextEmiDueDate',
    'nextPaymentDate',
  ]);
  const maturityDate = detailValue(record, [
    'maturityDate',
    'loanMaturityDate',
    'dueDate',
  ]);
  const emiAmount = detailValue(record, [
    'emiAmount',
    'monthlyEmi',
    'emi',
    'monthlyPayment',
  ]);
  const premiumAmount = detailValue(record, [
    'premiumAmount',
    'premium',
    'installmentAmount',
  ]);
  const loanStatus = titleCase(detailValue(record, ['status']) || 'active');
  const insuranceStatus = titleCase(
    detailValue(record, ['policyStatus', 'status']) || 'active',
  );
  const counterparty = isLoan
    ? detailValue(record, [
        'counterparty',
        'borrower',
        'lender',
        'who',
        'party',
        'paidTo',
        'receivedFrom',
      ])
    : '';
  const amountExtras = isLoan
    ? [
        ['Interest rate', detailValue(record, ['interestRate', 'rate'])],
        ['Loan term', detailValue(record, ['loanTerm', 'term'])],
      ].filter(([, value]) => value)
    : [];
  const borrowers =
    detailValue(record, [
      'borrowers',
      'borrowerNames',
      'coBorrowers',
      'coBorrower',
      'borrowerName',
    ]) || counterparty;
  const insuranceRows = [
    ['Policyholder', owner],
    [institutionLabel, institution || 'Not added yet'],
    ['Policy number', maskReference(reference)],
    [categoryLabel, categoryValue],
    [
      'Premium',
      formatCurrencyAmount(
        premiumAmount,
        currency,
        detailValue(record, ['premiumFrequency', 'paymentFrequency'])
          ? ` / ${detailValue(record, ['premiumFrequency', 'paymentFrequency']).toLowerCase()}`
          : '',
      ),
    ],
    [
      'Policy term',
      detailValue(record, ['policyTerm', 'term', 'termYears']) ||
        'Not added yet',
    ],
    [
      'Policy start',
      formatDate(detailValue(record, ['startDate', 'policyStartDate'])) ||
        'Not added yet',
    ],
    ['Renewal', formatDate(renewalDate) || 'Not added yet'],
  ];
  const loanRows = [
    ['Borrowers', borrowers || 'Not added yet'],
    ['Loan number', maskReference(reference)],
    [
      'EMI',
      emiAmount
        ? `${formatCurrencyAmount(emiAmount, currency)} / month`
        : 'Not added yet',
    ],
    ['Next EMI', formatDate(nextEmiDate) || 'Not added yet'],
    ['Maturity', formatDate(maturityDate || dateValue) || 'Not added yet'],
  ];
  const nomineeIsRelevant = record.type === 'ASSET' || isInsurance;
  const nomineeName = detailValue(record, ['nomineeName', 'nominee']);
  const nomineeRelationship = detailValue(record, [
    'nomineeRelationship',
    'nomineeRelation',
  ]);
  const nomineeIsNamed = record.details.nominee === true;
  const nominee =
    nomineeName && nomineeRelationship
      ? `${nomineeName} · ${nomineeRelationship}`
      : nomineeName ||
        (nomineeIsNamed ? 'Nominee details added' : 'Not added yet');
  const accessNote =
    detailValue(record, ['accessInstruction', 'accessNote']) ||
    record.notes?.trim() ||
    '';
  const accessContactName = detailValue(record, ['accessContactName']);
  const accessContactPhone = detailValue(record, ['accessContactPhone']);
  const attachment = record.attachments[0];
  const attachmentLabel = isInsurance
    ? 'Policy document'
    : isLoan
      ? 'Loan document'
      : isAccount
        ? 'Account statement'
        : 'Investment document';
  const attachmentEmpty = isInsurance
    ? 'No policy document attached'
    : isLoan
      ? 'No loan document attached'
      : isAccount
        ? 'No account statement attached'
        : 'No investment document attached';
  const accessNoteTitle = isInsurance
    ? 'Policy access instructions'
    : isLoan
      ? 'Loan access instructions'
      : isAccount
        ? 'Account access instructions'
        : 'Investment access instructions';
  const accessNoteMissingTitle = 'Access note missing';
  const accessNoteMissingMessage = isLoan
    ? 'Help your family contact the lender and understand the next steps.'
    : 'Help your family contact the insurer and understand how to make a claim.';

  return (
    <Screen scroll padded={false} contentContainerStyle={styles.content}>
      <Row align="center" gap="sm" style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          hitSlop={8}
          onPress={onBack}
          style={styles.back}
        >
          <ChevronLeft
            size={sizes.icon.md}
            color={theme.colors.icon.interactive}
          />
        </Pressable>
        <AppText variant="overviewTitle" numberOfLines={1} style={styles.title}>
          {record.title}
        </AppText>
      </Row>

      <Row align="center" justify="space-between" style={styles.familyContext}>
        <AppText variant="caption" color="interactive">
          {userName ? `${userName} · You` : 'You'}
        </AppText>
        <AppText variant="caption" color="secondary">
          Family wealth register
        </AppText>
      </Row>

      <AppText variant="bodySm" color="interactive">
        {isLoan
          ? `Loan · ${loanStatus}`
          : isInsurance
            ? `${categoryValue} · ${insuranceStatus}`
            : `${categoryValue}${reference ? ` · ${maskReference(reference).replace('•••• ', '')}` : ''}`}
      </AppText>
      <Row align="center" gap="xs">
        <AppText variant="numeric">{formatAmount(amount, currency)}</AppText>
        {isLoan || isInsurance ? (
          <AppText variant="label" color="secondary">
            {isLoan ? 'outstanding' : 'cover'}
          </AppText>
        ) : null}
      </Row>

      <Card style={styles.detailsCard}>
        {!isLoan && !isInsurance ? (
          <>
            <AppText variant="label">{detailTitle}</AppText>
            <DetailRow label="Owner" value={owner} />
            <DetailRow
              label={institutionLabel}
              value={institution || 'Not added yet'}
            />
            <DetailRow
              label={isAccount ? 'Account number' : 'Investment reference'}
              value={maskReference(reference)}
            />
            <DetailRow label={categoryLabel} value={categoryValue} />
            <DetailRow
              label={amountLabel}
              value={formatAmount(amount, currency)}
            />
            <DetailRow
              label={dateLabel}
              value={formattedDate || 'Not added yet'}
            />
          </>
        ) : null}
        {isInsurance
          ? insuranceRows.map(([label, value]) => (
              <DetailRow key={label} label={label} value={value} />
            ))
          : null}
        {isLoan
          ? loanRows.map(([label, value]) => (
              <DetailRow key={label} label={label} value={value} />
            ))
          : null}
        {isLoan
          ? amountExtras.map(([label, value]) => (
              <DetailRow key={label} label={label} value={value} />
            ))
          : null}
      </Card>

      {nomineeIsRelevant || isLoan ? (
        <Card style={styles.linkCard}>
          {isLoan ? (
            <CircleHelp
              size={sizes.icon.md}
              color={theme.colors.icon.interactive}
            />
          ) : (
            <UserRound
              size={sizes.icon.md}
              color={theme.colors.icon.interactive}
            />
          )}
          <View style={styles.linkCopy}>
            <AppText variant="listTitle">Nominee</AppText>
            <AppText variant="bodySm" color="secondary">
              {isLoan ? 'Not applicable to this loan' : nominee}
            </AppText>
          </View>
          <ChevronRight
            size={sizes.icon.md}
            color={theme.colors.icon.interactive}
          />
        </Card>
      ) : null}

      <Card style={styles.linkCard}>
        <FileText size={sizes.icon.md} color={theme.colors.icon.interactive} />
        <View style={styles.linkCopy}>
          <AppText variant="listTitle">{attachmentLabel}</AppText>
          <AppText variant="bodySm" color="secondary" numberOfLines={1}>
            {attachment?.title || attachment?.originalName || attachmentEmpty}
            {record.attachments.length > 1
              ? ` · +${record.attachments.length - 1} more`
              : ''}
          </AppText>
        </View>
        <ChevronRight
          size={sizes.icon.md}
          color={theme.colors.icon.interactive}
        />
      </Card>

      {accessNote ? (
        <>
          <Row
            align="center"
            justify="space-between"
            style={styles.sectionHeading}
          >
            <AppText variant="heading">Family access note</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit family access note"
              hitSlop={8}
              onPress={isLoan ? onEditAccessNote : onEdit}
            >
              <AppText variant="label" color="interactive">
                Edit
              </AppText>
            </Pressable>
          </Row>
          <Card
            style={[
              styles.noteCard,
              { backgroundColor: theme.colors.surface.brandTint },
            ]}
          >
            <Row align="center" gap="sm">
              <NotebookText
                size={sizes.icon.md}
                color={theme.colors.icon.interactive}
              />
              <AppText variant="label" color="interactive">
                {accessNoteTitle}
              </AppText>
            </Row>
            <AppText variant="bodySm">{accessNote}</AppText>
            {isLoan && (accessContactName || accessContactPhone) ? (
              <AppText variant="caption" color="secondary">
                {[accessContactName, accessContactPhone]
                  .filter(Boolean)
                  .join(' · ')}
              </AppText>
            ) : null}
          </Card>
        </>
      ) : isLoan || isInsurance ? (
        <>
          <Card
            style={[
              styles.missingNoteCard,
              { backgroundColor: theme.colors.status.warning.surface },
            ]}
          >
            <AppText
              variant="label"
              style={{ color: theme.colors.status.warning.text }}
            >
              {accessNoteMissingTitle}
            </AppText>
            <AppText variant="bodySm">{accessNoteMissingMessage}</AppText>
          </Card>
          <Button
            title="Add family access note"
            variant="secondary"
            onPress={isLoan ? onEditAccessNote : onEdit}
          />
        </>
      ) : (
        <>
          <Row
            align="center"
            justify="space-between"
            style={styles.sectionHeading}
          >
            <AppText variant="heading">Family access note</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit family access note"
              hitSlop={8}
              onPress={onEdit}
            >
              <AppText variant="label" color="interactive">
                Edit
              </AppText>
            </Pressable>
          </Row>
          <Card
            style={[
              styles.noteCard,
              { backgroundColor: theme.colors.surface.brandTint },
            ]}
          >
            <Row align="center" gap="sm">
              <NotebookText
                size={sizes.icon.md}
                color={theme.colors.icon.interactive}
              />
              <AppText variant="label" color="interactive">
                {accessNoteTitle}
              </AppText>
            </Row>
            <AppText variant="bodySm">
              No family access instructions added yet.
            </AppText>
          </Card>
        </>
      )}

      <AppText variant="bodySm" color="secondary">
        Only shared with trusted people after an SOS handoff.
      </AppText>

      <View style={styles.actions}>
        <Button title="Edit details" onPress={onEdit} />
        <Button
          title="Back to Wealth"
          variant="secondary"
          onPress={onBackToWealth}
        />
      </View>
    </Screen>
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
  title: { flex: 1 },
  familyContext: { minHeight: sizes.minimumTouchTarget },
  detailsCard: { padding: space[12], gap: spacing.sm },
  detailRow: { minHeight: space[20] },
  detailLabel: { flex: 1 },
  detailValue: { flex: 1, flexShrink: 1 },
  linkCard: {
    minHeight: sizes.listRow,
    padding: space[12],
    borderRadius: radius.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  linkCopy: { flex: 1, gap: space[2] },
  sectionHeading: { minHeight: sizes.minimumTouchTarget },
  noteCard: {
    padding: space[12],
    borderRadius: radius.surface,
    gap: spacing.sm,
  },
  missingNoteCard: {
    padding: space[12],
    borderRadius: radius.surface,
    gap: spacing.sm,
  },
  actions: { gap: spacing.sm },
});
