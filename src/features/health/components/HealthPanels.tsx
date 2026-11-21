import React from 'react';
import {
Pressable,
StyleSheet,
View
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import {
Bell,
CalendarClock,
Check,
Pencil,
Plus,
Shield,
X,
} from 'lucide-react-native';


import {
type HealthHomeReminder,
type HealthMember,
type HealthRecord,
} from '../../../api/health.api';

import { useAppTheme } from '../../../design/theme/ThemeProvider';

import { AppText } from '../../../components/primitives/AppText';
import { Card } from '../../../components/primitives/Card';
import { Row } from '../../../components/primitives/Row';
import { ListGroup, ListRow } from '../../../components/primitives/ListRow';
import { sizes } from '../../../design/tokens/sizes';
import { styles } from '../healthStyles';
import { formatDate } from '../../../utils/format';
import { calculateMedicalReadiness } from '../medicalReadiness';

export function Reminders({
  reminders: reminderItems,
  onAdd,
}: {
  reminders: HealthHomeReminder[];
  onAdd: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <Card
      style={
        styles.remindersCard
      }
    >
      <Row
        align="center"
        justify="space-between"
      >
        <Row
          align="center"
          gap="sm"
        >
          <Bell
            size={sizes.icon.md}
            color={
              theme.colors.text.secondary
            }
          />

          <AppText
            variant="heading"
            style={
              styles.sectionTitle
            }
          >
            Reminders
          </AppText>
        </Row>

        <Pressable
          onPress={onAdd}
          style={[
            styles.addReminder,
            {
              borderColor:
                theme.colors.status.warning.surface,

              backgroundColor:
                theme.colors.status.warning.surface,
            },
          ]}
        >
          <Plus
            size={sizes.icon.sm}
            color={
              theme.colors.status.warning.text
            }
          />

          <AppText
            variant="label"
            style={{
              color:
                theme.colors.status.warning.text,
            }}
          >
            Add
          </AppText>
        </Pressable>
      </Row>

      <ListGroup>
        {reminderItems.map(reminder => (
          <ListRow
            key={reminder.title}
            icon={<CalendarClock size={sizes.icon.md} color={theme.colors.icon.interactive} />}
            title={reminder.title}
            subtitle={
              reminder.dueDate
                ? formatDate(reminder.dueDate)
                : `${reminder.memberName} · no due date`
            }
          />
        ))}
      </ListGroup>
    </Card>
  );
}


// ============================================================================
// MEDICAL READINESS
// ============================================================================

export function MedicalReadiness({
  member,
  records,
  onEdit,
}: {
  member?: HealthMember;
  records?: HealthRecord[];
  onEdit: () => void;
}) {
  const { theme } = useAppTheme();
  const readiness = member && records ? calculateMedicalReadiness(member, records) : undefined;
  const missing = readiness?.items.filter(item => !item.ready).map(item => item.label) ?? [];

  return (
    <Card
      style={
        styles.medicalCard
      }
    >
      <Row
        align="center"
        justify="space-between"
      >
        <Row
          align="center"
          gap="sm"
        >
          <Shield
            size={sizes.icon.md}
            color={
              theme.colors.text.secondary
            }
          />

          <AppText
            variant="heading"
            style={
              styles.sectionTitle
            }
          >
            Medical readiness
          </AppText>
        </Row>

        <Row align="center" gap="xs">
          <AppText variant="caption" color="secondary">
            {member?.name ?? 'Profile'}
          </AppText>
          {member ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Edit ${member.name}'s medical profile`}
              onPress={onEdit}
              hitSlop={12}
              style={styles.healthSmallAction}
            >
              <Pencil size={sizes.icon.md} color={theme.colors.text.interactive} />
            </Pressable>
          ) : null}
        </Row>
      </Row>

      <Row
        align="center"
        gap="sm"
        style={
          styles.medicalSummary
        }
      >
        <View style={readinessStyles.ring}>
          <Svg width={64} height={64}>
            <Circle cx={32} cy={32} r={29} stroke={theme.colors.border.emphasis} strokeWidth={6} fill="none" />
            {readiness && readiness.percentage > 0 ? (
              <Circle
                cx={32}
                cy={32}
                r={29}
                stroke={theme.colors.status.warning.icon}
                strokeWidth={6}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 29} ${2 * Math.PI * 29}`}
                strokeDashoffset={2 * Math.PI * 29 * (1 - readiness.percentage / 100)}
                rotation="-90"
                origin="32, 32"
              />
            ) : null}
          </Svg>
          <View style={readinessStyles.ringLabel}>
            <AppText variant="label" align="center">
              {readiness ? `${readiness.percentage}%` : '—'}
            </AppText>
          </View>
        </View>

        <AppText
          variant="body"
          color="secondary"
          style={
            styles.medicalDescription
          }
        >
          document completeness,
          not a health score
        </AppText>

      </Row>

      <View
        accessibilityRole="progressbar"
        accessibilityLabel={readiness ? `${readiness.percentage}% medical readiness` : 'Medical readiness unavailable'}
        accessibilityValue={readiness ? { min: 0, max: 100, now: readiness.percentage } : undefined}
        style={[
          styles.readinessTrack,
          {
            backgroundColor:
              theme.colors.surface.raised,
          },
        ]}
      >
        <View
          style={[
            styles.readinessFill,
            {
              width: `${readiness?.percentage ?? 0}%`,
              backgroundColor:
                theme.colors.status.warning.icon,
            },
          ]}
        />
      </View>

      <AppText
        variant="body"
        color="secondary"
        style={
          styles.stillNeeded
        }
      >
        {readiness ? `Still needed: ${missing.length ? missing.join(', ') : 'None'}` : 'Readiness unavailable until records are loaded.'}
      </AppText>

      {readiness?.items.map(item => (
        <Row key={item.label} align="center" gap="xs">
          {item.ready
            ? <Check size={sizes.icon.sm} color={theme.colors.status.success.icon} />
            : <X size={sizes.icon.sm} color={theme.colors.status.danger.icon} />}
          <AppText variant="bodySm" color="secondary">{item.label}: {item.ready ? 'Ready' : 'Missing'}</AppText>
        </Row>
      ))}
      <View
        style={[
          styles.divider,
          {
            backgroundColor:
              theme.colors.border.default,
          },
        ]}
      />

      <Row
        align="center"
        justify="space-between"
        style={
          styles.medicalRow
        }
      >
        <AppText
          variant="body"
          color="muted"
        >
          Conditions
        </AppText>

        <AppText
          variant="body"
          style={
            styles.medicalValue
          }
        >
          {member?.conditions ?? 'Not added'}
        </AppText>
      </Row>

      <Row
        align="center"
        justify="space-between"
        style={
          styles.medicalRow
        }
      >
        <AppText
          variant="body"
          color="muted"
        >
          Allergies
        </AppText>

        <AppText
          variant="body"
          style={[
            styles.medicalValue,
            {
              color:
                theme.colors.status.danger.text,
            },
          ]}
        >
          {member?.allergies ?? 'Not added'}
        </AppText>
      </Row>

      <Row
        align="center"
        justify="space-between"
        style={
          styles.medicalRow
        }
      >
        <AppText
          variant="body"
          color="muted"
        >
          Emergency
        </AppText>

        <AppText
          variant="body"
          style={
            styles.medicalValue
          }
        >
          {[member?.emergencyContactName, member?.emergencyContactPhone].filter(Boolean).join(' · ') || 'Not added'}
        </AppText>
      </Row>
    </Card>
  );
}

const readinessStyles = StyleSheet.create({
  ring: { width: 64, height: 64 },
  ringLabel: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});


// ============================================================================
// HEALTH SCREEN
// ============================================================================
