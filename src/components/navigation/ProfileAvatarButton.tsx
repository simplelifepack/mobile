import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../app/navigation/types';
import { radius } from '../../design/tokens/radius';
import { sizes } from '../../design/tokens/sizes';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { useBootstrapQuery } from '../../services/api';
import { AppText } from '../primitives/AppText';

export function ProfileAvatarButton() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data } = useBootstrapQuery();
  const initial = data?.user?.name?.trim().charAt(0).toUpperCase() || '?';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Profile"
      onPress={() => navigation.navigate('Profile')}
      style={({ pressed }) => [
        styles.avatar,
        {
          backgroundColor: theme.colors.surface.raised,
          borderColor: theme.colors.border.default,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <AppText variant="heading" color="secondary" align="center">
        {initial}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: sizes.minimumTouchTarget,
    height: sizes.minimumTouchTarget,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
