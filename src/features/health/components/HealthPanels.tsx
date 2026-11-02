import React from 'react';
import {
Pressable,
View
} from 'react-native';

import {
Bell,
CalendarClock,
Plus,
Shield
} from 'lucide-react-native';


import {
type HealthHomeReminder,
type HealthMember
} from '../../../api/health.api';

import { useAppTheme } from '../../../design/theme/ThemeProvider';

import { AppText } from '../../../components/primitives/AppText';
import { Card } from '../../../components/primitives/Card';
import { Row } from '../../../components/primitives/Row';
import { ListGroup, ListRow } from '../../../components/primitives/ListRow';
import { sizes } from '../../../design/tokens/sizes';
import { styles } from '../healthStyles';
import { formatDate } from '../../../utils/format';

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
  readiness,
  member,
}: {
  readiness: number;
  member?: HealthMember;
}) {
  const { theme } = useAppTheme();
  const missing = [
    !member?.conditions ? 'Conditions' : undefined,
    !member?.allergies ? 'Allergies' : undefined,
    !member?.emergencyContactName ? 'Emergency contact' : undefined,
  ].filter(Boolean);

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

        <AppText variant="caption" color="secondary">
          {member?.name ?? 'Profile'}
        </AppText>
      </Row>

      <Row
        align="center"
        gap="sm"
        style={
          styles.medicalSummary
        }
      >
        <AppText
          style={[
            styles.medicalPercentage,
            {
              color:
                theme.colors.status.warning.text,
            },
          ]}
        >
          {readiness}%
        </AppText>

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

        <AppText variant="caption" color="muted">
          Vault verification
        </AppText>
      </Row>

      <View
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
              width: `${readiness}%`,
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
        Still needed: {missing.length ? missing.join(', ') : 'None'}
      </AppText>

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
          {member?.emergencyContactName ?? 'Not added'}
        </AppText>
      </Row>
    </Card>
  );
}


// ============================================================================
// HEALTH SCREEN
// ============================================================================
