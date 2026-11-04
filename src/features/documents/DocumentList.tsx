import React from 'react';
import {
  Fingerprint,
  Briefcase,
  Heart,
  Receipt,
  FileText,
  ChevronRight,
  Circle,
  CircleCheck,
  SlidersHorizontal,
} from 'lucide-react-native';
import styled from 'styled-components/native';
import { AppText } from '../../components/primitives/AppText';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import type { DocumentRecord } from '../../api/web.types';
import { documentPerson } from './documentFilters';
export const DocumentList = styled.View(({ theme }) => ({
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: theme.radius.panel,
  overflow: 'hidden',
  backgroundColor: theme.colors.surface,
}));
const Item = styled.Pressable<{ $last: boolean }>(({ theme, $last }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.sm + theme.spacing.xs,
  padding: theme.spacing.md,
  minHeight: 76,
  borderBottomWidth: $last ? 0 : 1,
  borderBottomColor: theme.colors.border,
}));
const Badge = styled.View(({ theme }) => ({
  width: 40,
  height: 40,
  backgroundColor: theme.colors.primarySoft,
  borderRadius: theme.radius.md,
  alignItems: 'center',
  justifyContent: 'center',
}));
const Copy = styled.View(({ theme }) => ({ flex: 1, gap: theme.spacing.xs }));
const Title = styled(AppText).attrs({ variant: 'rowTitle', numberOfLines: 2 })(
  () => ({ flexShrink: 1 }),
);
const Toolbar = styled.View(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.sm,
}));
const Count = styled(AppText).attrs({ color: 'muted', variant: 'caption' })(
  () => ({ flex: 1 }),
);
const TextAction = styled.Pressable(({ theme }) => ({
  minHeight: theme.sizes.minimumTouchTarget,
  paddingHorizontal: theme.spacing.xs,
  flexDirection: 'row',
  gap: theme.spacing.xs,
  alignItems: 'center',
  justifyContent: 'center',
}));
function contextDate(document: DocumentRecord) {
  if (document.expiryDate) {
    const today = new Date();
    const target = Date.parse(`${document.expiryDate.slice(0, 10)}T00:00:00Z`);
    const delta = Math.round(
      (target -
        Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
        86400000,
    );
    if (Number.isFinite(delta))
      return delta > 0
        ? `${delta}d`
        : delta === 0
          ? 'Expires today'
          : `Expired ${-delta}d ago`;
  }
  const date = new Date(document.documentDate || document.createdAt);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
      })
    : 'Date not set';
}
export function DocumentToolbar({
  count,
  selecting,
  selectedCount,
  onSelect,
  onFilter,
}: {
  count: number;
  selecting: boolean;
  selectedCount: number;
  onSelect: () => void;
  onFilter: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Toolbar>
      <Count>
        {selecting ? `${selectedCount} selected · ` : ''}
        {count} {count === 1 ? 'document' : 'documents'}
      </Count>
      <TextAction accessibilityRole="button" onPress={onSelect}>
        <AppText variant="label" color="accent">
          {selecting ? 'Done' : 'Select'}
        </AppText>
      </TextAction>
      <TextAction accessibilityRole="button" onPress={onFilter}>
        <SlidersHorizontal size={18} color={theme.colors.primary} />
        <AppText variant="label" color="accent">
          Filter
        </AppText>
      </TextAction>
    </Toolbar>
  );
}
export function DocumentRow({
  document,
  currentUserName,
  selecting,
  selected,
  last,
  disabled,
  onPress,
}: {
  document: DocumentRecord;
  currentUserName?: string;
  selecting: boolean;
  selected: boolean;
  last: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const category =
    `${document.category} ${document.documentType}`.toLowerCase();
  const Icon = /identity|passport|aadhaar|pan\b|licen[cs]e/.test(category)
    ? Fingerprint
    : /employment|payslip|salary|offer/.test(category)
      ? Briefcase
      : /health|medical|prescription/.test(category)
        ? Heart
        : /finance|payment|receipt|bank/.test(category)
          ? Receipt
          : FileText;
  const title = document.displayName || document.title || document.originalName;
  return (
    <Item
      $last={last}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${documentPerson(document, currentUserName)}, ${contextDate(document)}`}
      accessibilityState={{
        selected: selecting && selected,
        disabled: Boolean(disabled),
      }}
      onPress={onPress}
    >
      <Badge>
        <Icon size={22} color={theme.colors.primary} />
      </Badge>
      <Copy>
        <Title>{title}</Title>
        {document.sourceProvider === 'DIGILOCKER' ? (
          <AppText variant="caption" color="muted">
            DigiLocker
          </AppText>
        ) : null}
        <AppText variant="caption" color="muted">
          {documentPerson(document, currentUserName)} · {contextDate(document)}
        </AppText>
      </Copy>
      {selecting ? (
        selected ? (
          <CircleCheck size={22} color={theme.colors.primary} />
        ) : (
          <Circle size={22} color={theme.colors.textMuted} />
        )
      ) : (
        <ChevronRight size={20} color={theme.colors.textMuted} />
      )}
    </Item>
  );
}
