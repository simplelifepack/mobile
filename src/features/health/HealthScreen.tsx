import React, { useEffect, useMemo, useState } from 'react';
import { useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';

import {
  Bell,
  CalendarClock,
  CalendarDays,
  ChevronRight,
  FileText,
  IdCard,
  Pill,
  Plus,
  Search,
  Shield,
  Upload,
  Users,
} from 'lucide-react-native';

import Svg, {
  Circle,
  Polyline,
} from 'react-native-svg';

import { useBootstrapQuery } from '../../services/api';
import type { MainTabParamList, RootStackParamList } from '../../app/navigation/types';
import {
  healthApi,
  type HealthAvailableMetric,
  type HealthHomeReminder,
  type HealthMedication,
  type HealthMember,
  type HealthOverview,
  type HealthTimelineEvent,
  type HealthMemberResolution,
  type HealthRecordDetail,
  type TrackedHealthMetric,
} from '../../api/health.api';
import {
  captureDocumentPhoto,
  discardSelectedDocument,
  selectDocumentFile,
  selectImageFromGallery,
  type SelectedDocument,
} from '../documents/documentImport';
import {
  healthDocumentTypeLabels,
  importHealthRecord,
  resolutionMessage,
  type HealthDocumentType,
} from './healthRecordImport';

import { useAppTheme } from '../../design/theme/ThemeProvider';

import { AppText } from '../../components/primitives/AppText';
import { Button } from '../../components/primitives/Button';
import { FloatingActionButton } from '../../components/primitives/FloatingActionButton';
import { Card } from '../../components/primitives/Card';
import { Row } from '../../components/primitives/Row';
import { Screen } from '../../components/primitives/Screen';
import { Stack } from '../../components/primitives/Stack';


// ============================================================================
// DATA
// ============================================================================

const tabs = [
  'Overview',
  'Timeline',
  'Medications',
  'Records',
];


type ReadingView = {
  id: string;
  title: string;
  value: string;
  unit: string;
  status: string;
  range?: string;
  dates: string[];
  values: number[];
  color: 'danger' | 'primary';
  sourceName?: string;
};


// ============================================================================
// HELPERS
// ============================================================================

function memberColor(
  tone: string,
) {
  switch (tone) {
    case 'purple':
      return '#9B72E8';

    case 'green':
      return '#36B995';

    case 'pink':
      return '#D96BB1';

    case 'gold':
      return '#D8B45A';

    default:
      return '#4F8CFF';
  }
}


// ============================================================================
// HEADER
// ============================================================================

function Header({
  onFamily,
  onSearch,
}: {
  onFamily: () => void;
  onSearch: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <Row
      align="center"
      justify="space-between"
      style={styles.header}
    >
      <AppText
        variant="title"
        style={styles.headerTitle}
      >
        Health
      </AppText>

      <Row gap="xs">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Family profiles"
          onPress={onFamily}
          style={[
            styles.headerButton,
            {
              backgroundColor:
                theme.colors
                  .surfaceElevated,
              borderColor:
                theme.colors.border,
            },
          ]}
        >
          <Users
            size={20}
            color={
              theme.colors.textPrimary
            }
            strokeWidth={2}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose tracked tests"
          onPress={onSearch}
          style={[
            styles.headerButton,
            {
              backgroundColor:
                theme.colors.surface,
              borderColor:
                theme.colors.border,
            },
          ]}
        >
          <Search
            size={20}
            color={
              theme.colors.textSecondary
            }
            strokeWidth={2}
          />
        </Pressable>

        <View
          style={[
            styles.profileButton,
            {
              backgroundColor:
                theme.colors
                  .surfaceElevated,
              borderColor:
                theme.colors.border,
            },
          ]}
        >
          <AppText
            style={[
              styles.profileInitial,
              {
                color:
                  theme.colors.warning,
              },
            ]}
          >
            A
          </AppText>
        </View>
      </Row>
    </Row>
  );
}


// ============================================================================
// FAMILY MEMBERS
// ============================================================================

function MemberSelector({
  members,
  selected,
  onSelect,
}: {
  members: HealthMember[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const { theme } = useAppTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={
        styles.membersScroll
      }
    >
      <Row gap="sm">
        {members.map(member => {
          const isSelected = selected === member.id;
          const color = memberColor(member.relation.toLowerCase());
          const initials = member.name
            .trim()
            .split(/\s+/)
            .map(part => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <Pressable
              key={member.id}
              onPress={() => onSelect(member.id)}
              style={
                styles.memberItem
              }
            >
              <View
                style={[
                  styles.memberAvatar,
                  {
                    backgroundColor:
                      isSelected
                        ? theme.colors
                            .surfaceElevated
                        : color +
                          '18',

                    borderColor:
                      isSelected
                        ? theme.colors
                            .primary
                        : 'transparent',
                  },
                ]}
              >
                <AppText
                  style={[
                    styles.memberInitial,
                    {
                      color,
                    },
                  ]}
                >
                  {initials}
                </AppText>
              </View>

              <AppText
                variant="label"
                color={
                  isSelected
                    ? 'primary'
                    : 'secondary'
                }
                align="center"
                style={
                  styles.memberName
                }
              >
                {member.name}
              </AppText>
            </Pressable>
          );
        })}
      </Row>
    </ScrollView>
  );
}


// ============================================================================
// MEMBER PROFILE
// ============================================================================

function MemberProfile({
  member,
}: {
  member: HealthMember;
}) {
  const { theme } = useAppTheme();
  const initials = member.name
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const age = member.dateOfBirth
    ? Math.floor(
        (Date.now() - Date.parse(member.dateOfBirth)) /
          (365.25 * 24 * 60 * 60 * 1000),
      )
    : undefined;

  return (
    <View
      style={styles.profile}
    >
      <View
        style={[
          styles.profileAvatar,
          {
            backgroundColor:
              theme.colors.primary +
              '18',

            borderColor:
              theme.colors.primary +
              '66',
          },
        ]}
      >
        <AppText
          style={[
            styles.profileAvatarText,
            {
              color:
                theme.colors.primary,
            },
          ]}
        >
          {initials}
        </AppText>
      </View>

      <Stack
        gap="xs"
        style={
          styles.profileContent
        }
      >
        <AppText
          variant="heading"
          style={
            styles.profileName
          }
        >
          {member.name}
        </AppText>

        <AppText
          variant="body"
          color="secondary"
          style={
            styles.profileMeta
          }
        >
          {member.relation}
          {age !== undefined ? ` · ${age}` : ''}
          {member.bloodGroup ? ` · ${member.bloodGroup}` : ''}
        </AppText>

        <AppText
          variant="caption"
          color="secondary"
          numberOfLines={2}
        >
          {member.primaryDoctor ?? 'Primary doctor not added'}
        </AppText>
      </Stack>
    </View>
  );
}


// ============================================================================
// PREPARE VISIT
// ============================================================================

function PrepareVisit({ onPress }: { onPress: () => void }) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.prepareVisit,
        {
          backgroundColor:
            theme.colors.primary,
        },
      ]}
    >
      <CalendarDays
        size={22}
        color={
          theme.colors.onPrimary
        }
        strokeWidth={2}
      />

      <AppText
        style={[
          styles.prepareText,
          {
            color:
              theme.colors.onPrimary,
          },
        ]}
      >
        Prepare for a visit
      </AppText>

      
    </Pressable>
  );
}


// ============================================================================
// QUICK ACTIONS
// ============================================================================

function QuickActions({
  onEmergency,
  onInsurance,
}: {
  onEmergency: () => void;
  onInsurance: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <View style={styles.quickActions}>
      <Pressable
        onPress={onEmergency}
        style={[
          styles.quickAction,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <IdCard
          size={22}
          color={theme.colors.textPrimary}
          strokeWidth={2}
        />

        <AppText
          style={styles.quickActionText}
          numberOfLines={1}
        >
          Emergency info
        </AppText>
      </Pressable>

      <Pressable
        onPress={onInsurance}
        style={[
          styles.quickAction,
          {
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Shield
          size={22}
          color={theme.colors.textPrimary}
          strokeWidth={2}
        />

        <AppText
          style={styles.quickActionText}
          numberOfLines={1}
        >
          Insurance card
        </AppText>
      </Pressable>
    </View>
  );
}


// ============================================================================
// TABS
// ============================================================================

function HealthTabs({
  activeTab,
  onChange,
}: {
  activeTab: string;
  onChange: (tab: string) => void;
}) {
  const { theme } = useAppTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={
        styles.tabsScroll
      }
    >
      <View
        style={[
          styles.tabs,
          {
            borderBottomColor:
              theme.colors.border,
          },
        ]}
      >
        {tabs.map(tab => {
          const active =
            activeTab === tab;

          return (
            <Pressable
              key={tab}
              onPress={() =>
                onChange(tab)
              }
              style={[
                styles.tab,
                active && {
                  borderBottomColor:
                    theme.colors
                      .primary,
                },
              ]}
            >
              <AppText
                variant="label"
                color={
                  active
                    ? 'primary'
                    : 'secondary'
                }
                style={
                  styles.tabText
                }
              >
                {tab}
              </AppText>

              {tab ===
              'Medications' ? (
                <View
                  style={[
                    styles.tabCount,
                    {
                      backgroundColor:
                        theme.colors
                          .surfaceElevated,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    color="secondary"
                  >
                    2
                  </AppText>
                </View>
              ) : null}

              {tab ===
              'Records' ? (
                <View
                  style={[
                    styles.tabCount,
                    {
                      backgroundColor:
                        theme.colors
                          .surfaceElevated,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    color="secondary"
                  >
                    5
                  </AppText>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}


// ============================================================================
// TREND CHART
// ============================================================================

function TrendChart({
  values,
  color,
  labels,
  range,
}: {
  values: number[];
  color: string;
  labels: string[];
  range?: string;
}) {
  const { theme } = useAppTheme();

  const width = 340;
  const height = 92;

  const left = 30;
  const right = 10;
  const top = 8;
  const bottom = 20;

  const chartWidth =
    width - left - right;

  const chartHeight =
    height - top - bottom;

  const min =
    Math.min(...values);

  const max =
    Math.max(...values);

  const spread =
    max - min || 1;

  const points = values.map(
    (value, index) => {
      const x =
        left +
        (chartWidth *
          index) /
          Math.max(
            values.length - 1,
            1,
          );

      const y =
        top +
        chartHeight -
        ((value - min) /
          spread) *
          chartHeight;

      return `${x},${y}`;
    },
  );

  return (
    <View
      style={styles.chartContainer}
    >
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        <Circle
          cx={left}
          cy={height - bottom}
          r={2}
          fill={theme.colors.border}
        />

        <Polyline
          points={points.join(
            ' ',
          )}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {values.map(
          (value, index) => {
            const [
              x,
              y,
            ] = points[
              index
            ]
              .split(',')
              .map(Number);

            return (
              <Circle
                key={`${value}-${index}`}
                cx={x}
                cy={y}
                r={
                  index ===
                  values.length - 1
                    ? 5
                    : 3
                }
                fill={color}
              />
            );
          },
        )}
      </Svg>

      <View
        style={
          styles.chartLabels
        }
      >
        <AppText
          variant="caption"
          color="muted"
        >
          {labels[0]}
        </AppText>

        <AppText
          variant="caption"
          color="muted"
        >
          {labels[labels.length - 1]}
        </AppText>
      </View>

      {range ? (
        <AppText
          variant="caption"
          style={[
            styles.chartRange,
            {
              color:
                theme.colors
                  .success,
            },
          ]}
        >
          printed range ≤{' '}
          {range.replace(
            'under ',
            '',
          )}
        </AppText>
      ) : null}
    </View>
  );
}


// ============================================================================
// READING CARD
// ============================================================================

function ReadingCard({
  reading,
}: {
  reading: ReadingView;
}) {
  const { theme } = useAppTheme();

  const lineColor =
    reading.color ===
    'danger'
      ? theme.colors.danger
      : theme.colors.primary;

  return (
    <Card
      style={
        styles.readingCard
      }
    >
      <Row
        align="center"
        justify="space-between"
        gap="sm"
      >
        <AppText
          variant="body"
          color="secondary"
          style={
            styles.readingTitle
          }
          numberOfLines={2}
        >
          {reading.title}
        </AppText>

        {reading.status !== 'no range on file' ? (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: (reading.status === 'outside printed range'
                  ? theme.colors.danger
                  : theme.colors.success) + '14',
                borderColor: (reading.status === 'outside printed range'
                  ? theme.colors.danger
                  : theme.colors.success) + '66',
              },
            ]}
          >
            <AppText
              variant="caption"
              style={{
                color: reading.status === 'outside printed range'
                  ? theme.colors.danger
                  : theme.colors.success,
                fontWeight:
                  '600',
              }}
            >
              {reading.status}
            </AppText>
          </View>
        ) : (
          <AppText
            variant="caption"
            color="muted"
            style={
              styles.noRangeText
            }
          >
            no range on
            {'\n'}
            file
          </AppText>
        )}
      </Row>

      <Row
        align="center"
        gap="sm"
      >
        <AppText
          variant="title"
          style={
            styles.readingValue
          }
        >
          {reading.value}
        </AppText>

        <AppText
          variant="body"
          color="secondary"
        >
          {reading.unit}
        </AppText>

        <AppText
          variant="caption"
          color="muted"
          style={
            styles.rangeText
          }
          numberOfLines={1}
        >
          {reading.range
            ? `range on this report: ${reading.range}`
            : 'no range printed on the report'}
        </AppText>
      </Row>

      <TrendChart
        values={
          reading.values
        }
        color={lineColor}
        labels={
          reading.dates
        }
        range={
          reading.range
        }
      />

      <Row
        align="center"
        justify="space-between"
        gap="sm"
      >
        <Row
          align="center"
          gap="xs"
          style={
            styles.sourceRow
          }
        >
          <FileText
            size={16}
            color={
              theme.colors
                .textMuted
            }
          />

          <AppText
            variant="caption"
            color="muted"
            numberOfLines={1}
            style={
              styles.sourceText
            }
          >
            {reading.sourceName ?? 'Health measurement'}
          </AppText>
        </Row>

        <AppText variant="caption" color="muted">
          Latest
        </AppText>
      </Row>
    </Card>
  );
}


// ============================================================================
// REMINDERS
// ============================================================================

function Reminders({
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

function MedicalReadiness({
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

export function HealthScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<MainTabParamList, 'Health'>,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();

  const bootstrap =
    useBootstrapQuery();
  const [members, setMembers] = useState<HealthMember[]>([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [overview, setOverview] = useState<HealthOverview>();
  const [timeline, setTimeline] = useState<HealthTimelineEvent[]>([]);
  const [reminders, setReminders] = useState<HealthHomeReminder[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [healthError, setHealthError] = useState<string>();
  const [memberFormVisible, setMemberFormVisible] = useState(false);
  const [reminderFormVisible, setReminderFormVisible] = useState(false);
  const [metricPickerVisible, setMetricPickerVisible] = useState(false);
  const [medicationFormVisible, setMedicationFormVisible] = useState(false);
  const [addHealthVisible, setAddHealthVisible] = useState(false);
  const [readingFormVisible, setReadingFormVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resolution, setResolution] = useState<HealthMemberResolution>();

  const [
    activeTab,
    setActiveTab,
  ] = useState('Overview');

  const refreshMemberData = async (memberId: string) => {
    const [nextOverview, nextTimeline] = await Promise.all([
      healthApi.overview(memberId),
      healthApi.timeline(memberId),
    ]);
    setOverview(nextOverview);
    setTimeline(nextTimeline);
  };

  useEffect(() => {
    let active = true;
    Promise.all([healthApi.members(), healthApi.reminders()])
      .then(([loadedMembers, loadedReminders]) => {
        if (!active) return;
        setMembers(loadedMembers);
        setReminders(loadedReminders);
        setSelectedMember(current => current || loadedMembers[0]?.id || '');
      })
      .catch(loadError => {
        if (active) {
          setHealthError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load health profiles.',
          );
        }
      })
      .finally(() => {
        if (active) setLoadingMembers(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedMember) return;
    let active = true;
    setLoadingOverview(true);
    Promise.all([
      healthApi.overview(selectedMember),
      healthApi.timeline(selectedMember),
    ])
      .then(([loadedOverview, loadedTimeline]) => {
        if (!active) return;
        setOverview(loadedOverview);
        setTimeline(loadedTimeline);
      })
      .catch(loadError => {
        if (active) {
          setHealthError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load this health profile.',
          );
        }
      })
      .finally(() => {
        if (active) setLoadingOverview(false);
      });
    return () => {
      active = false;
    };
  }, [selectedMember]);

  const readiness =
    useMemo(() => {
      const documents =
        bootstrap.data
          ?.documents ?? [];

      if (!documents.length) {
        return 0;
      }

      const verified =
        documents.filter(
          document =>
            document.classificationStatus ===
              'verified' &&
            document.ownershipStatus ===
              'verified',
        ).length;

      return Math.round(
        (verified /
          documents.length) *
          100,
      );
    }, [
      bootstrap.data?.documents,
    ]);

  const member =
    members.find(
      item => item.id === selectedMember,
    );

  const readings: ReadingView[] = (overview?.trackedMetrics ?? [])
    .filter(metric => metric.latest)
    .map(metric => {
      const latest = metric.latest!;
      const points = metric.measurements.slice(-4);
      const outsideRange =
        (latest.referenceMin != null && latest.value < latest.referenceMin) ||
        (latest.referenceMax != null && latest.value > latest.referenceMax);
      return {
        id: metric.id,
        title: metric.displayName,
        value:
          latest.secondaryValue == null
            ? String(latest.value)
            : `${latest.value}/${latest.secondaryValue}`,
        unit: latest.unit,
        status: outsideRange
          ? 'outside printed range'
          : latest.referenceText || latest.referenceMin != null || latest.referenceMax != null
            ? 'within reference range'
            : 'no range on file',
        range:
          latest.referenceText ??
          (latest.referenceMax != null
            ? `under ${latest.referenceMax}`
            : latest.referenceMin != null
              ? `over ${latest.referenceMin}`
              : undefined),
        dates: points.map(point =>
          point.measuredAt
            ? new Date(point.measuredAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            : '',
        ),
        values: points.map(point => point.value),
        color: outsideRange ? 'danger' : 'primary',
        sourceName: latest.originalName,
      };
    });

  const toggleMedication = async (medication: HealthMedication) => {
    try {
      await healthApi.updateMedication(medication.id, {
        status: medication.status === 'stopped' ? 'continuing' : 'stopped',
        stoppedAt: medication.status === 'stopped' ? null : new Date().toISOString(),
      });
      await refreshMemberData(selectedMember);
    } catch (error) {
      setHealthError(error instanceof Error ? error.message : 'Unable to update medication.');
    }
  };

  const showImportedRecord = async (record: HealthRecordDetail) => {
    setSelectedMember(record.memberId);
    await refreshMemberData(record.memberId);
    setActiveTab(record.type === 'prescription' ? 'Medications' : 'Records');
    Alert.alert(
      'Health record added',
      record.measurements.length
        ? `${record.measurements.length} measurement(s) were extracted.`
        : record.processingStatus === 'failed'
          ? "We couldn't process this health record. Try again."
          : 'Health record processed.',
    );
  };

  const runRecordImport = async (
    selected: SelectedDocument,
    aiConsent: boolean,
    type: HealthDocumentType | undefined,
    memberId: string | undefined,
  ) => {
    setImporting(true);
    setHealthError(undefined);
    try {
      const result = await importHealthRecord(selected, {
        memberId,
        type,
        aiConsent,
      });
      if (result.kind === 'resolution') {
        setResolution(result.resolution);
        Alert.alert('Choose a profile', resolutionMessage(result.resolution));
      } else {
        await showImportedRecord(result.record);
      }
    } catch (importError) {
      setHealthError(
        importError instanceof Error
          ? importError.message
          : 'Health record could not be processed.',
      );
    } finally {
      setImporting(false);
    }
  };

  const chooseRecordType = (
    selected: SelectedDocument,
    aiConsent: boolean,
  ) => {
    if (aiConsent) {
      runRecordImport(selected, true, undefined, selectedMember || undefined);
      return;
    }
    Alert.alert(
      'Record type',
      'What kind of record is this?',
      [
        ...(Object.keys(healthDocumentTypeLabels) as HealthDocumentType[]).map(
          type => ({
            text: healthDocumentTypeLabels[type],
            onPress: () =>
              runRecordImport(selected, false, type, selectedMember || undefined),
          }),
        ),
      ],
      {
        cancelable: true,
        onDismiss: () => discardSelectedDocument(selected),
      },
    );
  };

  const startRecordImport = async (
    select: () => Promise<SelectedDocument | undefined>,
  ) => {
    try {
      const selected = await select();
      if (!selected) return;
      Alert.alert(
        'Analyze health record?',
        'The file is encrypted on this device before upload. Choose whether to allow AI analysis to extract measurements and medicines.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => discardSelectedDocument(selected),
          },
          { text: 'Rules only', onPress: () => chooseRecordType(selected, false) },
          { text: 'Allow AI', onPress: () => chooseRecordType(selected, true) },
        ],
        { cancelable: false },
      );
    } catch (selectionError) {
      Alert.alert(
        'Unable to select file',
        selectionError instanceof Error
          ? selectionError.message
          : 'Please try again.',
      );
    }
  };

  const chooseRecordSource = () => {
    Alert.alert(
      'Add health record',
      'Upload a lab report, medical report or prescription.',
      [
        { text: 'Choose file', onPress: () => startRecordImport(selectDocumentFile) },
        { text: 'Photo library', onPress: () => startRecordImport(selectImageFromGallery) },
        { text: 'Camera', onPress: () => startRecordImport(captureDocumentPhoto) },
      ],
      { cancelable: true },
    );
  };

  const confirmResolution = async (memberId: string) => {
    if (!resolution) return;
    setImporting(true);
    try {
      const record = await healthApi.createRecord({
        memberId,
        documentId: resolution.documentId,
        type: resolution.type,
      });
      if ('processingStatus' in record && record.processingStatus === 'awaiting_profile_match') {
        throw new Error('A health profile still needs to be selected.');
      }
      setResolution(undefined);
      await showImportedRecord(record as HealthRecordDetail);
    } catch (resolveError) {
      setHealthError(
        resolveError instanceof Error
          ? resolveError.message
          : 'Unable to assign this health record.',
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <Screen
      scroll
      padded={false}
floatingAction={
  <>
    <FloatingActionButton
      accessibilityLabel="Add to Health"
      onPress={() => setAddHealthVisible(true)}
    />
    {addHealthVisible ? (
      <AddToHealthSheet
        memberName={member?.name ?? 'your profile'}
        onClose={() => setAddHealthVisible(false)}
        onRecord={() => {
          setAddHealthVisible(false);
          chooseRecordSource();
        }}
        onReading={() => {
          setAddHealthVisible(false);
          setReadingFormVisible(true);
        }}
        onReminder={() => {
          setAddHealthVisible(false);
          setReminderFormVisible(true);
        }}
        onMedicine={() => {
          setAddHealthVisible(false);
          setMedicationFormVisible(true);
        }}
        onFamilyMember={() => {
          setAddHealthVisible(false);
          setMemberFormVisible(true);
        }}
      />
    ) : null}
  </>
}    >
      <Stack
        gap="xs"
        style={[
          styles.container,
          {
            paddingTop: theme.spacing.xs,
            paddingBottom: theme.spacing.lg,
          },
        ]}
      >
        {/* HEADER */}

        <Header
          onFamily={() => navigation.navigate('Family')}
          onSearch={() => setMetricPickerVisible(true)}
        />
        {healthError ? (
          <AppText variant="caption" color="danger">
            {healthError}
          </AppText>
        ) : null}
        {importing ? (
          <AppText variant="caption" color="secondary">
            Processing health record…
          </AppText>
        ) : null}
        {loadingMembers || loadingOverview ? (
          <AppText variant="caption" color="secondary">
            Loading health records…
          </AppText>
        ) : null}

        {/* FAMILY MEMBERS */}

        <MemberSelector
          members={members}
          selected={
            selectedMember
          }
          onSelect={
            setSelectedMember
          }
        />

        {/* MEMBER PROFILE */}

        {member ? (
          <MemberProfile member={member} />
        ) : (
          <Card>
            <Stack gap="sm">
              <AppText variant="heading">No health profiles yet</AppText>
              <AppText color="secondary">
                Add a family health profile to start organizing care.
              </AppText>
              <Pressable onPress={() => setMemberFormVisible(true)}>
                <AppText variant="label" color="primary">Add health profile</AppText>
              </Pressable>
            </Stack>
          </Card>
        )}

        {/* PREPARE */}

        <PrepareVisit onPress={() => setActiveTab('Records')} />

        {/* QUICK ACTIONS */}

        <QuickActions
  onEmergency={() => navigation.navigate('Trust')}
  onInsurance={() => navigation.navigate('Documents')}
/>

        {/* TABS */}

        <HealthTabs
          activeTab={
            activeTab
          }
          onChange={
            setActiveTab
          }
        />

        {activeTab ===
        'Overview' ? (
          <Stack gap="sm">
            {/* RESULTS HEADER */}

           <Row
  align="center"
  gap="sm"
  style={styles.resultsHeader}
>
  <AppText
    variant="body"
    color="secondary"
    style={styles.resultsCount}
    numberOfLines={1}
  >
    Showing {readings.length} of{' '}
    {overview?.trackedMetrics?.length ?? readings.length}{' '}
    tracked tests
  </AppText>

  <Pressable
    onPress={() => setMetricPickerVisible(true)}
  >
    <AppText
      variant="label"
      color="primary"
      numberOfLines={1}
    >
      Choose tests
    </AppText>
  </Pressable>

  <Pressable>
    <AppText
      variant="label"
      color="primary"
      numberOfLines={1}
    >
      Show all
    </AppText>
  </Pressable>
</Row>
            {/* READINGS */}

            <Stack gap="sm">
              {readings.length ? readings.map(
                reading => (
                  <ReadingCard
                    key={
                      reading.id
                    }
                    reading={
                      reading
                    }
                  />
                ),
              ) : (
                <Card>
                  <AppText variant="body" color="secondary">
                    No tracked measurements yet.
                  </AppText>
                </Card>
              )}
            </Stack>

            {/* REMINDERS */}

            <Reminders
              reminders={reminders}
              onAdd={() => setReminderFormVisible(true)}
            />

            {/* MEDICAL READINESS */}

            <MedicalReadiness
              readiness={
                readiness
              }
              member={member}
            />
          </Stack>
        ) : activeTab === 'Timeline' ? (
          <Stack gap="sm">
            {timeline.length ? timeline.map(event => (
              <Card key={event.id}>
                <AppText variant="label">{event.title}</AppText>
                <AppText variant="caption" color="secondary">
                  {event.occurredAt ? new Date(event.occurredAt).toLocaleDateString() : 'Date not recorded'}
                  {event.detail ? ` · ${event.detail}` : ''}
                </AppText>
              </Card>
            )) : <Card><AppText color="secondary">No timeline activity yet.</AppText></Card>}
          </Stack>
        ) : activeTab === 'Medications' ? (
          <Stack gap="sm">
            <Button
              title="Add medication"
              variant="secondary"
              onPress={() => setMedicationFormVisible(true)}
            />
            {timeline.filter(event => event.medication).length
              ? timeline.filter(event => event.medication).map(event => (
                  <Card key={event.id}>
                    <AppText variant="label">{event.medication?.name}</AppText>
                    <AppText variant="caption" color="secondary">
                      {[event.medication?.dose, event.medication?.frequency, event.medication?.status]
                        .filter(Boolean).join(' · ')}
                    </AppText>
                    {event.medication ? (
                      <Button
                        title={event.medication.status === 'stopped' ? 'Resume' : 'Stop'}
                        variant="secondary"
                        onPress={() => { toggleMedication(event.medication!); }}
                      />
                    ) : null}
                  </Card>
                ))
              : <Card><AppText color="secondary">No medication records yet.</AppText></Card>}
          </Stack>
        ) : (
          <Stack gap="sm">
            {overview?.recentRecords.length
              ? overview.recentRecords.map(record => (
                  <Card key={record.id}>
                    <AppText variant="label">{record.type.replaceAll('_', ' ')}</AppText>
                    <AppText variant="caption" color="secondary">
                      {record.provider ?? record.doctor ?? 'Provider not recorded'} · {record.processingStatus}
                    </AppText>
                  </Card>
                ))
              : <Card><AppText color="secondary">No health records yet.</AppText></Card>}
          </Stack>
        )}
        {memberFormVisible ? (
          <HealthMemberForm
            onClose={() => setMemberFormVisible(false)}
            onSave={async payload => {
              const created = await healthApi.createMember(payload);
              setMembers(current => [...current, created]);
              setSelectedMember(created.id);
              setMemberFormVisible(false);
              if (resolution) await confirmResolution(created.id);
            }}
          />
        ) : null}
        {resolution && !memberFormVisible ? (
          <Modal visible transparent animationType="slide" onRequestClose={() => setResolution(undefined)}>
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalPanel, { backgroundColor: theme.colors.background }]}>
                <AppText variant="heading">Choose a profile</AppText>
                <AppText variant="caption" color="secondary">
                  {resolutionMessage(resolution)}
                </AppText>
                {(resolution.memberMatch.candidates.length
                  ? resolution.memberMatch.candidates
                  : members
                ).map(candidate => (
                  <Button
                    key={candidate.id}
                    title={candidate.name}
                    variant="secondary"
                    disabled={importing}
                    onPress={() => { confirmResolution(candidate.id); }}
                  />
                ))}
                <Button
                  title={
                    resolution.patient?.name
                      ? `Create profile for ${resolution.patient.name}`
                      : 'Create new profile'
                  }
                  disabled={importing}
                  onPress={() => setMemberFormVisible(true)}
                />
                <Button title="Cancel" variant="ghost" onPress={() => setResolution(undefined)} />
              </View>
            </View>
          </Modal>
        ) : null}
        {reminderFormVisible && selectedMember ? (
          <HealthReminderForm
            onClose={() => setReminderFormVisible(false)}
            onSave={async (title, dueDate) => {
              const created = await healthApi.createReminder({
                memberId: selectedMember,
                title,
                dueDate,
              });
              setReminders(current => [created, ...current]);
              setReminderFormVisible(false);
            }}
          />
        ) : null}
        {metricPickerVisible && member ? (
          <MetricPickerModal
            memberId={member.id}
            onClose={() => setMetricPickerVisible(false)}
            onChanged={() => refreshMemberData(member.id)}
          />
        ) : null}
        {medicationFormVisible && member ? (
          <MedicationForm
            memberId={member.id}
            onClose={() => setMedicationFormVisible(false)}
            onCreated={async () => {
              setMedicationFormVisible(false);
              await refreshMemberData(member.id);
            }}
          />
        ) : null}
        {readingFormVisible && member ? (
          <HealthReadingForm
            memberId={member.id}
            onClose={() => setReadingFormVisible(false)}
            onCreated={async () => {
              setReadingFormVisible(false);
              await refreshMemberData(member.id);
            }}
          />
        ) : null}
      </Stack>
    </Screen>
  );
}

function HealthReadingForm({
  memberId,
  onClose,
  onCreated,
}: {
  memberId: string;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const { theme } = useAppTheme();
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [context, setContext] = useState('');
  const [measuredAt, setMeasuredAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const save = async () => {
    const numericValue = Number(value);
    if (!name.trim() || !Number.isFinite(numericValue) || !unit.trim()) {
      setError('Enter a test name, numeric value, and unit.');
      return;
    }

    setSaving(true);
    setError(undefined);
    try {
      await healthApi.createMeasurement(memberId, {
        metricKey: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        displayName: name.trim(),
        originalName: name.trim(),
        value: numericValue,
        unit: unit.trim(),
        context: context.trim() || null,
        measuredAt: new Date(measuredAt).toISOString(),
      });
      await onCreated();
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Unable to save this reading.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalPanel,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Row align="center" justify="space-between">
            <AppText variant="heading">Add a reading</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
            >
              <AppText variant="label" color="secondary">Close</AppText>
            </Pressable>
          </Row>
          <HealthField label="Test or metric" value={name} onChangeText={setName} placeholder="Blood pressure" />
          <Row gap="sm">
            <View style={styles.readingValueField}>
              <HealthField label="Value" value={value} onChangeText={setValue} placeholder="120" keyboardType="decimal-pad" />
            </View>
            <View style={styles.readingUnitField}>
              <HealthField label="Unit" value={unit} onChangeText={setUnit} placeholder="mmHg" />
            </View>
          </Row>
          <HealthField label="Date" value={measuredAt} onChangeText={setMeasuredAt} placeholder="YYYY-MM-DD" />
          <HealthField label="Context (optional)" value={context} onChangeText={setContext} placeholder="Fasting, left arm…" />
          {error ? <AppText variant="caption" color="danger">{error}</AppText> : null}
          <Button
            title={saving ? 'Saving…' : 'Save reading'}
            disabled={saving}
            onPress={() => { save(); }}
          />
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// ADD TO HEALTH SHEET
// ============================================================================

function AddToHealthSheet({
  memberName,
  onClose,
  onRecord,
  onReading,
  onReminder,
  onMedicine,
  onFamilyMember,
}: {
  memberName: string;
  onClose: () => void;
  onRecord: () => void;
  onReading: () => void;
  onReminder: () => void;
  onMedicine: () => void;
  onFamilyMember: () => void;
}) {
  const { theme } = useAppTheme();

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.addHealthOverlay}>

        {/* Background / scrim */}
        <Pressable
          style={styles.addHealthBackdrop}
          onPress={onClose}
        />

        {/* Bottom sheet */}
        <View
          style={[
            styles.addHealthSheet,
            {
              backgroundColor:
                theme.colors.background,
              borderColor:
                theme.colors.border,
            },
          ]}
        >
          {/* Grabber */}

          <View
            style={[
              styles.addHealthGrabber,
              {
                backgroundColor:
                  theme.colors.surfaceElevated,
              },
            ]}
          />

          {/* Header */}

          <Stack gap="xs">
            <AppText
              variant="heading"
              style={styles.addHealthTitle}
            >
              Add to Health
            </AppText>

            <AppText
              variant="body"
              color="secondary"
              style={styles.addHealthSubtitle}
            >
              For {memberName}
            </AppText>
          </Stack>

          <View
            style={[
              styles.addHealthDivider,
              {
                backgroundColor:
                  theme.colors.border,
              },
            ]}
          />

          {/* A record */}

          <AddHealthRow
            icon={
              <Upload
                size={24}
                color={theme.colors.primary}
                strokeWidth={2}
              />
            }
            title="A record"
            description="Prescription, lab report, scan, or discharge summary"
            onPress={onRecord}
          />

          {/* A reading */}

          <AddHealthRow
            icon={
              <Plus
                size={25}
                color={theme.colors.primary}
                strokeWidth={2}
              />
            }
            title="A reading"
            description="Copy a value and its range from a report"
            onPress={onReading}
          />

          {/* A reminder */}

          <AddHealthRow
            icon={
              <Bell
                size={24}
                color={theme.colors.primary}
                strokeWidth={2}
              />
            }
            title="A reminder"
            description="Appointment, refill, or vaccination"
            onPress={onReminder}
          />

          {/* A medicine */}

          <AddHealthRow
            icon={
              <Pill
                size={24}
                color={theme.colors.primary}
                strokeWidth={2}
              />
            }
            title="A medicine"
            description="Name, dose, and how often"
            onPress={onMedicine}
          />

          {/* A family member */}

          <AddHealthRow
            icon={
              <Users
                size={25}
                color={theme.colors.primary}
                strokeWidth={2}
              />
            }
            title="A family member"
            description="Someone else whose records you keep"
            onPress={onFamilyMember}
            last
          />
        </View>
      </View>
    </Modal>
  );
}
function AddHealthRow({
  icon,
  title,
  description,
  onPress,
  last = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  last?: boolean;
}) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.addHealthRow,
        {
          borderBottomColor:
            theme.colors.border,
          borderBottomWidth: last ? 0 : 1,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      <View style={styles.addHealthIcon}>
        {icon}
      </View>

      <View style={styles.addHealthRowContent}>
        <AppText
          variant="body"
          style={styles.addHealthRowTitle}
        >
          {title}
        </AppText>

        <AppText
          variant="body"
          color="secondary"
          numberOfLines={2}
          style={styles.addHealthRowDescription}
        >
          {description}
        </AppText>
      </View>

      <ChevronRight
        size={22}
        color={theme.colors.textMuted}
        strokeWidth={2}
      />
    </Pressable>
  );
}

function MetricPickerModal({
  memberId,
  onClose,
  onChanged,
}: {
  memberId: string;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const { theme } = useAppTheme();
  const [search, setSearch] = useState('');
  const [available, setAvailable] = useState<HealthAvailableMetric[]>([]);
  const [tracked, setTracked] = useState<TrackedHealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(undefined);
    Promise.all([
      healthApi.availableMetrics(memberId, search),
      healthApi.trackedMetrics(memberId),
    ])
      .then(([items, current]) => {
        if (!active) return;
        setAvailable(items);
        setTracked(current);
      })
      .catch(loadError => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load tests.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [memberId, search]);

  const toggle = async (metric: HealthAvailableMetric) => {
    setBusyKey(metric.metricKey);
    setError(undefined);
    try {
      const trackedMetric = tracked.find(item => item.metricKey === metric.metricKey);
      if (trackedMetric) {
        await healthApi.untrackMetric(memberId, trackedMetric.id);
      } else {
        await healthApi.trackMetric(memberId, {
          metricKey: metric.metricKey,
          displayName: metric.displayName,
          context: metric.context,
          bodySite: metric.bodySite,
        });
      }
      const [items, refreshedTracked] = await Promise.all([
        healthApi.availableMetrics(memberId, search),
        healthApi.trackedMetrics(memberId),
      ]);
      setAvailable(items);
      setTracked(refreshedTracked);
      await onChanged();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Unable to update tracked tests.');
    } finally {
      setBusyKey(undefined);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalPanel, { backgroundColor: theme.colors.background }]}>
          <Row align="center" justify="space-between">
            <AppText variant="heading">Tracked tests</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose}>
              <AppText variant="label" color="secondary">Close</AppText>
            </Pressable>
          </Row>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search tests"
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.formInput, {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              color: theme.colors.textPrimary,
            }]}
          />
          {loading ? <AppText variant="caption" color="secondary">Loading tests…</AppText> : null}
          {error ? <AppText variant="caption" color="danger">{error}</AppText> : null}
          <ScrollView contentContainerStyle={styles.formContent}>
            {available.map(metric => {
              const isTracked = tracked.some(item => item.metricKey === metric.metricKey);
              return (
                <Pressable
                  key={metric.metricKey}
                  disabled={busyKey === metric.metricKey}
                  onPress={() => { toggle(metric); }}
                  style={[styles.metricChoice, { borderColor: theme.colors.border }]}
                >
                  <Stack gap="xs" style={styles.metricText}>
                    <AppText variant="label">{metric.displayName}</AppText>
                    <AppText variant="caption" color="secondary">
                      {metric.historicalReadingCount} readings · latest {metric.latestValue} {metric.unit}
                    </AppText>
                  </Stack>
                  <AppText variant="caption" color={isTracked ? 'primary' : 'secondary'}>
                    {busyKey === metric.metricKey ? 'Saving…' : isTracked ? 'Tracked' : 'Track'}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function MedicationForm({
  memberId,
  onClose,
  onCreated,
}: {
  memberId: string;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const { theme } = useAppTheme();
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('');
  const [runsOutAt, setRunsOutAt] = useState('');
  const [repeats, setRepeats] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const save = async () => {
    if (!name.trim() || !dose.trim()) {
      setError('Medication name and dose are required.');
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await healthApi.createMedication(memberId, {
        name: name.trim(),
        dose: dose.trim(),
        frequency: frequency.trim() || null,
        repeats,
        runsOutAt: runsOutAt.trim() || null,
      });
      await onCreated();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to add medication.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalPanel, { backgroundColor: theme.colors.background }]}>
          <AppText variant="heading">Add medication</AppText>
          <HealthField label="Name" value={name} onChangeText={setName} placeholder="Medication name" />
          <HealthField label="Dose" value={dose} onChangeText={setDose} placeholder="Dose" />
          <HealthField label="Frequency" value={frequency} onChangeText={setFrequency} placeholder="Daily, as needed..." />
          <HealthField label="Runs out" value={runsOutAt} onChangeText={setRunsOutAt} placeholder="YYYY-MM-DD" />
          <Row align="center" justify="space-between">
            <AppText variant="label">Repeats</AppText>
            <Switch value={repeats} onValueChange={setRepeats} />
          </Row>
          {error ? <AppText variant="caption" color="danger">{error}</AppText> : null}
          <Button title={saving ? 'Saving…' : 'Save medication'} disabled={saving} onPress={() => { save(); }} />
          <Button title="Cancel" variant="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

function HealthMemberForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (payload: {
    name: string;
    relation: string;
    bloodGroup: string | null;
    dateOfBirth: string | null;
  }) => Promise<void>;
}) {
  const { theme } = useAppTheme();
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('SELF');
  const [bloodGroup, setBloodGroup] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim() || !relation.trim()) {
      setError('Name and relationship are required.');
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await onSave({
        name: name.trim(),
        relation: relation.trim(),
        bloodGroup: bloodGroup.trim() || null,
        dateOfBirth: dateOfBirth.trim() || null,
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to add profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalPanel, { backgroundColor: theme.colors.background }]}>
          <Row align="center" justify="space-between">
            <AppText variant="heading">Add health profile</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose}>
              <AppText variant="label" color="secondary">Close</AppText>
            </Pressable>
          </Row>
          <HealthField label="Name" value={name} onChangeText={setName} placeholder="Full name" />
          <HealthField label="Relationship" value={relation} onChangeText={setRelation} placeholder="SELF, SPOUSE, CHILD..." />
          <HealthField label="Date of birth" value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" />
          <HealthField label="Blood group" value={bloodGroup} onChangeText={setBloodGroup} placeholder="O+" />
          {error ? <AppText variant="caption" color="danger">{error}</AppText> : null}
          <Button
            title={saving ? 'Saving…' : 'Save profile'}
            disabled={saving}
            onPress={() => {
              save();
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

function HealthReminderForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (title: string, dueDate: string) => Promise<void>;
}) {
  const { theme } = useAppTheme();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !dueDate.trim()) {
      setError('Reminder name and due date are required.');
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await onSave(title.trim(), dueDate.trim());
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to add reminder.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalPanel, { backgroundColor: theme.colors.background }]}>
          <Row align="center" justify="space-between">
            <AppText variant="heading">Add reminder</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose}>
              <AppText variant="label" color="secondary">Close</AppText>
            </Pressable>
          </Row>
          <HealthField label="Reminder" value={title} onChangeText={setTitle} placeholder="Follow-up appointment" />
          <HealthField label="Due date" value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" />
          {error ? <AppText variant="caption" color="danger">{error}</AppText> : null}
          <Button
            title={saving ? 'Saving…' : 'Save reminder'}
            disabled={saving}
            onPress={() => {
              save();
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

function HealthField({
  label,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  const { theme } = useAppTheme();
  return (
    <Stack gap="xs">
      <AppText variant="caption" color="secondary">{label}</AppText>
      <TextInput
        {...props}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.formInput,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            color: theme.colors.textPrimary,
          },
        ]}
      />
    </Stack>
  );
}


// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({

  // --------------------------------------------------------------------------
  // Main container
  // --------------------------------------------------------------------------

  container: {
    paddingHorizontal: 12,
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  modalPanel: {
    maxHeight: '85%',
    padding: 20,
    gap: 12,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },

  sheetGrabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8A97AE',
  },

  healthAddOption: {
    minHeight: 68,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  healthAddIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  healthAddCopy: {
    flex: 1,
    minWidth: 0,
  },

  formInput: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
  },

  readingValueField: {
    flex: 1.25,
    minWidth: 0,
  },

  readingUnitField: {
    flex: 1,
    minWidth: 0,
  },

  formContent: {
    gap: 12,
    paddingBottom: 20,
  },

  metricChoice: {
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  metricText: {
    flex: 1,
    minWidth: 0,
  },

  // --------------------------------------------------------------------------
  // Header
  // --------------------------------------------------------------------------

  header: {
    minHeight: 44,
  },

headerTitle: {
  fontSize: 28,
  lineHeight: 34,
  fontWeight: '700',
},

headerButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  borderWidth: 1,
  alignItems: 'center',
  justifyContent: 'center',
},
profileButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  borderWidth: 1,
  alignItems: 'center',
  justifyContent: 'center',
},

  profileInitial: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },

  // --------------------------------------------------------------------------
  // Members
  // --------------------------------------------------------------------------

  membersScroll: {
    paddingRight: 12,
    paddingVertical: 2,
  },

memberItem: {
  width: 72,
  alignItems: 'center',
  gap: 6,
},
  memberAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  memberInitial: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  },

  memberName: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },

  // --------------------------------------------------------------------------
  // Profile
  // --------------------------------------------------------------------------

  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },

  profileAvatar: {
    width: 66,
    height: 66,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileAvatarText: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '600',
  },

  profileContent: {
    flex: 1,
    marginLeft: 12,
  },

profileName: {
  fontSize: 22,
  lineHeight: 28,
  fontWeight: '700',
},
profileMeta: {
  fontSize: 15,
  lineHeight: 22,
},
  // --------------------------------------------------------------------------
  // Prepare
  // --------------------------------------------------------------------------

  prepareVisit: {
  minHeight: 64,
  borderRadius: 18,
  paddingHorizontal: 20,
  paddingVertical: 12,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},

prepareText: {
  flex: 1,
  fontSize: 17,
  lineHeight: 22,
  fontWeight: '700',
},

  // --------------------------------------------------------------------------
  // Quick actions
  // --------------------------------------------------------------------------

  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },

  quickAction: {
  flex: 1,
  minHeight: 60,
  borderRadius: 17,
  borderWidth: 1,
  paddingHorizontal: 12,
  paddingVertical: 12,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
  quickActionText: {
  flex: 1,
  fontSize: 15,
  lineHeight: 20,
  fontWeight: '600',
},

  // --------------------------------------------------------------------------
  // Tabs
  // --------------------------------------------------------------------------

  tabsScroll: {
    paddingRight: 12,
  },

  tabs: {
    minHeight: 48,
    flexDirection: 'row',
    borderBottomWidth: 1,
  },

  tab: {
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },

  tabText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },

  tabCount: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // --------------------------------------------------------------------------
  // Results header
  // --------------------------------------------------------------------------

  resultsHeader: {
  minHeight: 34,
},

resultsCount: {
  flex: 1,
  fontSize: 13,
  lineHeight: 20,
},

  // --------------------------------------------------------------------------
  // Reading cards
  // --------------------------------------------------------------------------

  readingCard: {
    padding: 12,
    gap: 8,
  },

  readingTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },

  statusBadge: {
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  noRangeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },

  readingValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },

  rangeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },

  // --------------------------------------------------------------------------
  // Chart
  // --------------------------------------------------------------------------

  chartContainer: {
    width: '100%',
    height: 102,
    position: 'relative',
  },

  chartLabels: {
    position: 'absolute',
    left: 30,
    right: 10,
    bottom: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  chartRange: {
    position: 'absolute',
    right: 10,
    bottom: 22,
    fontSize: 12,
    lineHeight: 16,
  },

  removeReading: {
    fontSize: 13,
    lineHeight: 20,
  },

  sourceRow: {
    flex: 1,
    minWidth: 0,
  },

  sourceText: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 18,
  },

  // --------------------------------------------------------------------------
  // Reminders
  // --------------------------------------------------------------------------

  remindersCard: {
    padding: 16,
    gap: 6,
  },

  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },

  addReminder: {
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  divider: {
    width: '100%',
    height: 1,
    marginVertical: 4,
  },

  reminderRow: {
    minHeight: 68,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  reminderContent: {
    flex: 1,
  },

  reminderTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },

  reminderAction: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },

  // --------------------------------------------------------------------------
  // Medical readiness
  // --------------------------------------------------------------------------

  medicalCard: {
    padding: 16,
    gap: 12,
  },

  editButton: {
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  medicalSummary: {
    marginTop: 2,
  },

  medicalPercentage: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
  },

  medicalDescription: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },

  howButton: {
    minWidth: 58,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  readinessTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },

  readinessFill: {
    height: '100%',
    borderRadius: 4,
  },

  stillNeeded: {
    fontSize: 13,
    lineHeight: 20,
  },

  medicalRow: {
    minHeight: 42,
  },

  medicalValue: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },

  // --------------------------------------------------------------------------
  // Empty
  // --------------------------------------------------------------------------

  emptyCard: {
    paddingVertical: 24,
    gap: 8,
  },
  // --------------------------------------------------------------------------
// Add to Health bottom sheet
// --------------------------------------------------------------------------

addHealthOverlay: {
  flex: 1,
  justifyContent: 'flex-end',
},

addHealthBackdrop: {
  ...StyleSheet.absoluteFill,
  backgroundColor: 'rgba(0, 0, 0, 0.62)',
},

addHealthSheet: {
  width: '100%',
  maxHeight: '78%',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  borderWidth: 1,
  paddingHorizontal: 24,
  paddingTop: 12,
  paddingBottom: 20,
},

addHealthGrabber: {
  width: 76,
  height: 7,
  borderRadius: 4,
  alignSelf: 'center',
  marginBottom: 32,
},

addHealthTitle: {
  fontSize: 24,
  lineHeight: 30,
  fontWeight: '700',
},

addHealthSubtitle: {
  fontSize: 17,
  lineHeight: 22,
},

addHealthDivider: {
  height: 1,
  marginTop: 32,
},

addHealthRow: {
  minHeight: 82,
  flexDirection: 'row',
  alignItems: 'center',
  paddingVertical: 12,
  gap: 16,
},

addHealthIcon: {
  width: 36,
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
},

addHealthRowContent: {
  flex: 1,
  minWidth: 0,
},

addHealthRowTitle: {
  fontSize: 17,
  lineHeight: 24,
  fontWeight: '700',
},

addHealthRowDescription: {
  marginTop: 4,
  fontSize: 15,
  lineHeight: 22,
},
});