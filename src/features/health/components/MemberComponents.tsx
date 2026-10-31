import React from 'react';
import {
Pressable,
ScrollView,
View
} from 'react-native';

import {
Search,
Users
} from 'lucide-react-native';


import {
type HealthMember
} from '../../../api/health.api';

import { useAppTheme } from '../../../design/theme/ThemeProvider';

import { AppText } from '../../../components/primitives/AppText';
import { Row } from '../../../components/primitives/Row';
import { Stack } from '../../../components/primitives/Stack';
import { styles } from '../healthStyles';

export function memberColor(
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

export function Header({
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

export function MemberSelector({
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

export function MemberProfile({
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
