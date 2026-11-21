import React from 'react';
import {
View
} from 'react-native';

import {
type HealthMember
} from '../../../api/health.api';

import { useAppTheme } from '../../../design/theme/ThemeProvider';

import { AppText } from '../../../components/primitives/AppText';
import { Row } from '../../../components/primitives/Row';
import { Stack } from '../../../components/primitives/Stack';
import { ProfileAvatarButton } from '../../../components/navigation/ProfileAvatarButton';
import { styles } from '../healthStyles';
import { humanizeLabel } from '../../../utils/format';

// ============================================================================
// HEADER
// ============================================================================

export function Header() {
  return (
    <Row
      align="center"
      justify="space-between"
      style={styles.header}
    >
      <AppText
        variant="overviewTitle"
      >
        Health
      </AppText>

      <ProfileAvatarButton />
    </Row>
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
              theme.colors.selection.surface,

            borderColor:
              theme.colors.selection.surface,
          },
        ]}
      >
        <AppText
          style={[
            styles.profileAvatarText,
            {
              color:
                theme.colors.text.interactive,
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
          {humanizeLabel(member.relation)}
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
