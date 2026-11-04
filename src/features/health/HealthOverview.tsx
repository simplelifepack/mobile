import { EmptyArtwork } from '../../components/feedback/EmptyArtwork';
import { TextAction } from '../../components/primitives/TextAction';
import React from 'react';
import {
  FlaskConical,
  ClipboardList,
  ShieldCheck,
  IdCard,
} from 'lucide-react-native';
import styled from 'styled-components/native';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { Stack } from '../../components/primitives/Stack';
import { Row } from '../../components/primitives/Row';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import type { HealthMember, HealthMeasurement } from '../../api/web.types';
import { MeasurementTrend } from './MeasurementTrend';
const Avatar = styled.View(({ theme }) => ({
  width: 42,
  height: 42,
  borderRadius: theme.radius.lg,
  borderWidth: 1,
  borderColor: theme.colors.primary,
  backgroundColor: theme.colors.primarySoft,
  alignItems: 'center',
  justifyContent: 'center',
}));
const Copy = styled.View(({ theme }) => ({ flex: 1, gap: theme.spacing.xs }));
const Action = styled.Pressable<{ $primary?: boolean }>(
  ({ theme, $primary }) => ({
    minHeight: theme.sizes.button.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: $primary
      ? theme.colors.primary
      : theme.colors.surfaceElevated,
    borderWidth: $primary ? 0 : 1,
    borderColor: theme.colors.border,
    flex: $primary ? undefined : 1,
  }),
);
const MetricCard = styled.View(({ theme }) => ({
  backgroundColor: theme.colors.surface,
  borderRadius: theme.radius.panel,
  borderWidth: 1,
  borderColor: theme.colors.border,
  padding: theme.spacing.md,
  gap: theme.spacing.sm,
}));
const RangeBadge = styled.View<{ $outside: boolean }>(
  ({ theme, $outside }) => ({
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: $outside
      ? theme.dashboard.dangerSoft
      : theme.dashboard.successSoft,
  }),
);
export function HealthIdentity({
  member,
  onEdit,
  onPrepare,
}: {
  member: HealthMember;
  onEdit: () => void;
  onPrepare: (view: string) => void;
}) {
  const { theme } = useAppTheme();
  const dob = member.dateOfBirth ? new Date(member.dateOfBirth) : null;
  const today = new Date();
  const age =
    dob && Number.isFinite(dob.getTime())
      ? today.getFullYear() -
        dob.getFullYear() -
        (today.getMonth() < dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
          ? 1
          : 0)
      : null;
  return (
    <Stack gap="sm">
      <Row align="center">
        <Avatar>
          <AppText color="accent" variant="label">
            {member.name[0]?.toUpperCase()}
          </AppText>
        </Avatar>
        <Copy>
          <AppText variant="label">{member.name}</AppText>
          <AppText variant="caption" color="muted">
            {['self', 'myself'].includes(member.relation.toLowerCase())
              ? 'Self'
              : member.relation}
            {age !== null ? ` · ${age}` : ''}
            {member.bloodGroup ? ` · ${member.bloodGroup}` : ''}
          </AppText>
        </Copy>
        <Button title="Edit" variant="ghost" onPress={onEdit} />
      </Row>
      <Action
        $primary
        accessibilityRole="button"
        onPress={() => onPrepare('visit')}
      >
        <ClipboardList size={17} color={theme.colors.onPrimary} />
        <AppText color="onPrimary">Prepare for a visit</AppText>
      </Action>
      <Row gap="sm">
        <Action
          accessibilityRole="button"
          onPress={() => onPrepare('emergency')}
        >
          <IdCard size={16} color={theme.colors.textSecondary} />
          <AppText variant="caption">Emergency info</AppText>
        </Action>
        <Action
          accessibilityRole="button"
          onPress={() => onPrepare('insurance')}
        >
          <ShieldCheck size={16} color={theme.colors.textSecondary} />
          <AppText variant="caption">Insurance card</AppText>
        </Action>
      </Row>
    </Stack>
  );
}
export function TrackedTestCard({
  name,
  measurements,
  latest,
  onRemove,
  onLog,
  busy,
}: {
  name: string;
  measurements: HealthMeasurement[];
  latest: HealthMeasurement | null;
  onRemove: () => void;
  onLog?: () => void;
  busy: boolean;
}) {
  const { theme } = useAppTheme();
  const outside = Boolean(
    latest &&
    ((latest.referenceMin != null && latest.value < latest.referenceMin) ||
      (latest.referenceMax != null && latest.value > latest.referenceMax)),
  );
  const range =
    latest?.referenceText ||
    (latest?.referenceMin != null && latest.referenceMax != null
      ? `${latest.referenceMin}–${latest.referenceMax}`
      : latest?.referenceMax != null
        ? `under ${latest.referenceMax}`
        : latest?.referenceMin != null
          ? `over ${latest.referenceMin}`
          : 'Not provided');
  return (
    <MetricCard>
      <Row align="center" justify="space-between">
        <Copy>
          <AppText color="muted">{name}</AppText>
        </Copy>
        {latest &&
        (latest.referenceMin != null || latest.referenceMax != null) ? (
          <RangeBadge $outside={outside}>
            <AppText variant="caption" color={outside ? 'danger' : 'success'}>
              {outside ? 'outside printed range' : 'within printed range'}
            </AppText>
          </RangeBadge>
        ) : null}
      </Row>
      {latest ? (
        <>
          <Row align="center">
            <AppText variant="heading">
              {latest.value}
              {latest.secondaryValue != null
                ? ` / ${latest.secondaryValue}`
                : ''}
            </AppText>
            <AppText variant="caption" color="muted">
              {latest.unit}
            </AppText>
          </Row>
          <AppText variant="caption" color="muted">
            Range on this report: {range}
          </AppText>
          <MeasurementTrend
            measurements={measurements}
            tone={outside ? 'danger' : 'primary'}
          />
          <Row align="center">
            <FlaskConical size={13} color={theme.colors.textMuted} />
            <AppText variant="caption" color="muted">
              {latest.sourceType === 'manual'
                ? 'Manually logged'
                : 'From a report'}{' '}
              · {latest.measuredAt?.slice(0, 10) || 'Date not set'}
            </AppText>
          </Row>
        </>
      ) : (
        <Stack gap="sm" align="center">
          <EmptyArtwork kind="health" compact />
          <AppText color="muted" variant="caption" align="center">
            Add your first reading to see a trend.
          </AppText>
          {onLog ? <Button title="Log a reading" onPress={onLog} /> : null}
        </Stack>
      )}
      <TextAction title="Stop tracking" disabled={busy} onPress={onRemove} />
    </MetricCard>
  );
}
