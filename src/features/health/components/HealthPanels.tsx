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
import { Stack } from '../../../components/primitives/Stack';
import { styles } from '../healthStyles';

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
            size={19}
            color={
              theme.colors
                .textSecondary
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
                theme.colors
                  .warning +
                '66',

              backgroundColor:
                theme.colors
                  .warning +
                '0D',
            },
          ]}
        >
          <Plus
            size={16}
            color={
              theme.colors
                .warning
            }
          />

          <AppText
            variant="label"
            style={{
              color:
                theme.colors
                  .warning,
            }}
          >
            Add
          </AppText>
        </Pressable>
      </Row>

      <View
        style={[
          styles.divider,
          {
            backgroundColor:
              theme.colors.border,
          },
        ]}
      />

      {reminderItems.map(
        (reminder, index) => (
          <View
            key={
              reminder.title
            }
            style={[
              styles.reminderRow,
              index > 0 && {
                borderTopWidth: 1,
                borderTopColor:
                  theme.colors
                    .border,
              },
            ]}
          >
            <View
              style={[
                styles.reminderIcon,
                {
                  backgroundColor:
                    theme.colors
                      .warning +
                    '18',
                },
              ]}
            >
              <CalendarClock
                size={18}
                color={
                  theme.colors
                    .warning
                }
              />
            </View>

            <Stack
              gap="xs"
              style={
                styles.reminderContent
              }
            >
              <AppText
                variant="label"
                style={
                  styles.reminderTitle
                }
              >
                {
                  reminder.title
                }
              </AppText>

              <AppText
                variant="caption"
                color="secondary"
              >
                {reminder.dueDate
                  ? new Date(reminder.dueDate).toLocaleDateString()
                  : `${reminder.memberName} · no due date`}
              </AppText>
            </Stack>

          </View>
        ),
      )}
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
            size={19}
            color={
              theme.colors
                .textSecondary
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
                theme.colors
                  .warning,
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
              theme.colors
                .surfaceElevated,
          },
        ]}
      >
        <View
          style={[
            styles.readinessFill,
            {
              width: `${readiness}%`,
              backgroundColor:
                theme.colors
                  .warning,
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
              theme.colors.border,
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
                theme.colors
                  .danger,
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
