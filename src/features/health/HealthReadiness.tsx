import React from 'react';
import { ShieldCheck } from 'lucide-react-native';
import styled from 'styled-components/native';
import type { HealthMember, HealthRecord } from '../../api/web.types';
import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { Card } from '../../components/primitives/Card';
import { Progress } from '../../components/primitives/Progress';
import { Stack } from '../../components/primitives/Stack';
import { useAppTheme } from '../../design/theme/ThemeProvider';

const Line = styled.View(({ theme }) => ({
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: theme.spacing.sm,
}));
const Title = styled(AppText)(() => ({ flex: 1, minWidth: 130 }));
const Explanation = styled(AppText)(() => ({ flex: 1, minWidth: 110 }));
const Fact = styled.View(({ theme }) => ({
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: theme.spacing.sm,
  justifyContent: 'space-between',
  paddingTop: theme.spacing.md,
  borderTopWidth: 1,
  borderTopColor: theme.colors.border,
}));
const Value = styled(AppText)(() => ({ flexShrink: 1, maxWidth: '70%' }));
const answered = (value?: string | null) => Boolean(value?.trim());

export function medicalReadiness(
  member: HealthMember,
  records: HealthRecord[],
) {
  const items = [
    {
      label: 'Blood group',
      ready:
        answered(member.bloodGroup) &&
        member.bloodGroup?.trim().toLowerCase() !== 'unknown',
    },
    { label: 'Conditions', ready: answered(member.conditions) },
    { label: 'Allergies', ready: answered(member.allergies) },
    {
      label: 'Emergency contact',
      ready:
        answered(member.emergencyContactName) &&
        answered(member.emergencyContactPhone),
    },
    { label: 'Primary doctor', ready: answered(member.primaryDoctor) },
    { label: 'Insurance on file', ready: answered(member.insuranceProvider) },
    {
      label: 'Prescription on file',
      ready: records.some(
        record =>
          record.memberId === member.id && record.type === 'prescription',
      ),
    },
  ];
  return {
    items,
    percentage: Math.round(
      (items.filter(item => item.ready).length / items.length) * 100,
    ),
  };
}

export function HealthReadiness({
  member,
  records,
  onEdit,
  onRecords,
}: {
  member: HealthMember;
  records: HealthRecord[];
  onEdit: () => void;
  onRecords: () => void;
}) {
  const { theme } = useAppTheme();
  const [showHow, setShowHow] = React.useState(false);
  React.useEffect(() => setShowHow(false), [member.id]);
  const { items, percentage } = medicalReadiness(member, records);
  const missing = items.filter(item => !item.ready).map(item => item.label);
  const emergency = [member.emergencyContactName, member.emergencyContactPhone]
    .filter(value => value?.trim())
    .join(' · ');
  const allergyRecorded =
    answered(member.allergies) &&
    !/^(none|no|nil|n\/a|unknown|no known allergies|none known)$/i.test(
      member.allergies!.trim(),
    );
  return (
    <Card>
      <Stack>
        <Line>
          <ShieldCheck size={20} color={theme.colors.textSecondary} />
          <Title variant="heading">Medical readiness</Title>
          <Button
            title="Edit"
            variant="secondary"
            accessibilityLabel="Edit medical readiness profile"
            onPress={onEdit}
          />
        </Line>
        <Line>
          <AppText variant="overviewTitle" color="warning">
            {percentage}%
          </AppText>
          <Explanation color="muted">
            document completeness, not a health score
          </Explanation>
          <Button
            title="How?"
            variant="secondary"
            accessibilityLabel="How medical readiness is calculated"
            accessibilityState={{ expanded: showHow }}
            onPress={() => setShowHow(value => !value)}
          />
        </Line>
        <Progress
          value={percentage}
          tone="warning"
          label={`${percentage}% medical readiness`}
        />
        <AppText color="muted">
          {missing.length
            ? `Still needed: ${missing.join(', ')}`
            : 'All readiness details recorded.'}
        </AppText>
        {showHow ? (
          <Stack gap="sm">
            <AppText color="muted">
              Each of the seven items counts equally. Record “None” for
              conditions or allergies when that is your answer. This checks
              recorded information and documents only.
            </AppText>
            {items.map(item => (
              <AppText
                key={item.label}
                variant="caption"
                color={item.ready ? 'success' : 'muted'}
              >
                {item.ready ? 'Recorded' : 'Still needed'} · {item.label}
              </AppText>
            ))}
            <Button
              title="View health records"
              variant="secondary"
              onPress={onRecords}
            />
          </Stack>
        ) : null}
        <Fact>
          <AppText color="muted">Conditions</AppText>
          <Value>{member.conditions?.trim() || 'Not answered yet'}</Value>
        </Fact>
        <Fact>
          <AppText color="muted">Allergies</AppText>
          <Value color={allergyRecorded ? 'danger' : 'primary'}>
            {member.allergies?.trim() || 'Not answered yet'}
          </Value>
        </Fact>
        <Fact>
          <AppText color="muted">Emergency</AppText>
          <Value>{emergency || 'Not answered yet'}</Value>
        </Fact>
      </Stack>
    </Card>
  );
}
