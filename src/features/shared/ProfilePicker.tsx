import React from 'react';
import styled from 'styled-components/native';
import { Users } from 'lucide-react-native';
import { AppText } from '../../components/primitives/AppText';
import { useAppTheme } from '../../design/theme/ThemeProvider';
const Scroll = styled.ScrollView.attrs({
  horizontal: true,
  showsHorizontalScrollIndicator: false,
})(() => ({ flexGrow: 0 }));
const Items = styled.View(({ theme }) => ({
  flexDirection: 'row',
  gap: theme.spacing.sm,
}));
const Profile = styled.Pressable<{ $selected?: boolean }>(({ theme }) => ({
  gap: theme.spacing.xs,
  alignItems: 'center',
  minHeight: 70,
  minWidth: 56,
  padding: theme.spacing.xs,
}));
const Avatar = styled.View<{ $selected?: boolean }>(({ theme, $selected }) => ({
  opacity: $selected ? 1 : 0.55,
  height: 40,
  width: 40,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.colors.primarySoft,
  borderRadius: theme.radius.pill,
  borderWidth: 1,
  borderColor: theme.colors.primary,
}));
const Labels = styled.View(() => ({ alignItems: 'center' }));
export function ProfilePicker({
  profiles,
  value,
  onChange,
  onAdd,
}: {
  profiles: Array<{ id: string; name: string; relation: string }>;
  value: string;
  onChange: (id: string) => void;
  onAdd?: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Scroll accessibilityLabel="Health profiles">
      <Items>
        {profiles.map(profile => (
          <Profile
            key={profile.id}
            $selected={value === profile.id}
            accessibilityRole="button"
            accessibilityState={{ selected: value === profile.id }}
            onPress={() => onChange(profile.id)}
          >
            <Avatar $selected={value === profile.id}>
              <AppText variant="label" color="accent">
                {profile.name
                  .split(' ')
                  .map(word => word[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </AppText>
            </Avatar>
            <Labels>
              <AppText variant="caption">{profile.name.split(' ')[0]}</AppText>
            </Labels>
          </Profile>
        ))}
        {onAdd ? (
          <Profile
            accessibilityRole="button"
            accessibilityLabel="Manage health profiles"
            onPress={onAdd}
          >
            <Avatar>
              <Users size={18} color={theme.colors.textMuted} />
            </Avatar>
            <AppText variant="caption">Manage</AppText>
          </Profile>
        ) : null}
      </Items>
    </Scroll>
  );
}
