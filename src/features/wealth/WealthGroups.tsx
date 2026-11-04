import React from 'react';
import {
  Coins,
  Landmark,
  ShieldCheck,
  Receipt,
  ChevronRight,
} from 'lucide-react-native';
import styled from 'styled-components/native';
import type { WealthRecord } from '../../api/web.types';
import { AppText } from '../../components/primitives/AppText';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import {
  classifyWealthRecord,
  statusFor,
  type WealthRecordDomain,
} from './wealthPresentation';
const Panel = styled.View(({ theme }) => ({
  backgroundColor: theme.colors.surface,
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: theme.radius.lg,
  overflow: 'hidden',
}));
const Heading = styled.View(({ theme }) => ({
  padding: theme.spacing.md,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottomWidth: 1,
  borderBottomColor: theme.colors.border,
}));
const Item = styled.Pressable(({ theme }) => ({
  padding: theme.spacing.sm + theme.spacing.xs,
  flexDirection: 'row',
  gap: theme.spacing.sm,
  alignItems: 'center',
  borderBottomWidth: 1,
  borderBottomColor: theme.colors.border,
  minHeight: 70,
}));
const Badge = styled.View(({ theme }) => ({
  width: 32,
  height: 32,
  borderRadius: theme.radius.sm,
  backgroundColor: theme.colors.primarySoft,
  alignItems: 'center',
  justifyContent: 'center',
}));
const Copy = styled.View(({ theme }) => ({ flex: 1, gap: theme.spacing.xs }));
const More = styled.Pressable(({ theme }) => ({
  minHeight: theme.sizes.minimumTouchTarget,
  alignItems: 'center',
  justifyContent: 'center',
}));
export function recordAmount(record: WealthRecord) {
  const raw =
    record.loanBreakdown?.outstanding ??
    record.details.value ??
    record.details.amount ??
    record.details.principalAmount ??
    record.details.coverageAmount;
  if (raw === null || raw === undefined || raw === '') return null;
  const parsed =
    typeof raw === 'number' ? raw : Number(String(raw).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}
function currency(record: WealthRecord) {
  return typeof record.details.currency === 'string'
    ? record.details.currency
    : 'INR';
}
function money(value: number, code: string) {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: code,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return `${code} ${value.toLocaleString()}`;
  }
}
export function WealthGroups({
  records,
  onOpen,
  disabled,
}: {
  records: WealthRecord[];
  onOpen: (record: WealthRecord) => void;
  disabled: boolean;
}) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const { theme } = useAppTheme();
  const groups: Array<{
    key: WealthRecordDomain;
    label: string;
    Icon: typeof Coins;
  }> = [
    { key: 'asset', label: 'Accounts and investments', Icon: Coins },
    { key: 'liability', label: 'Loans', Icon: Landmark },
    { key: 'protection', label: 'Insurance', Icon: ShieldCheck },
    { key: 'lentBorrowed', label: 'Lent, borrowed and proofs', Icon: Receipt },
  ];
  return (
    <>
      {groups.map(({ key, label, Icon }) => {
        const rows = records.filter(
          record => classifyWealthRecord(record) === key,
        );
        if (!rows.length) return null;
        const totals = new Map<string, number>();
        for (const record of rows) {
          const amount = recordAmount(record);
          if (amount !== null)
            totals.set(
              currency(record),
              (totals.get(currency(record)) ?? 0) + amount,
            );
        }
        return (
          <Panel key={key}>
            <Heading>
              <AppText variant="label">{label}</AppText>
              <AppText variant="caption" color="muted">
                {[...totals]
                  .map(([code, total]) => money(total, code))
                  .join(' · ')}
              </AppText>
            </Heading>
            {rows.slice(0, expanded[key] ? undefined : 3).map(record => {
              const status = statusFor(record);
              const gaps = [
                !status.document ? 'No document' : '',
                !status.access ? 'No access note' : '',
                !status.nominee && ['ASSET', 'INSURANCE'].includes(record.type)
                  ? 'No nominee'
                  : '',
              ].filter(Boolean);
              const amount = recordAmount(record);
              return (
                <Item
                  key={record.id}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${record.title}`}
                  onPress={() => onOpen(record)}
                >
                  <Badge>
                    <Icon size={18} color={theme.colors.primary} />
                  </Badge>
                  <Copy>
                    <AppText variant="rowTitle" numberOfLines={1}>
                      {record.title}
                    </AppText>
                    <AppText variant="caption" color="muted" numberOfLines={1}>
                      {[
                        record.details.assetType ||
                          record.details.subtype ||
                          record.details.loanType ||
                          record.details.insuranceType,
                        record.details.provider,
                      ]
                        .filter(Boolean)
                        .map(String)
                        .join(' · ') || label}
                    </AppText>
                    {gaps.length ? (
                      <AppText variant="caption" color="danger">
                        {gaps.join(' · ')}
                      </AppText>
                    ) : null}
                  </Copy>
                  {amount !== null ? (
                    <AppText
                      variant="rowTitle"
                      color={key === 'liability' ? 'danger' : 'primary'}
                    >
                      {key === 'liability' ? '−' : ''}
                      {money(amount, currency(record))}
                    </AppText>
                  ) : null}
                  <ChevronRight size={17} color={theme.colors.textMuted} />
                </Item>
              );
            })}
            {rows.length > 3 ? (
              <More
                accessibilityRole="button"
                onPress={() =>
                  setExpanded(previous => ({
                    ...previous,
                    [key]: !previous[key],
                  }))
                }
              >
                <AppText variant="action" color="accent">
                  {expanded[key] ? 'Show less' : `Show all ${rows.length}`}
                </AppText>
              </More>
            ) : null}
          </Panel>
        );
      })}
    </>
  );
}
