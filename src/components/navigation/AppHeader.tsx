import React from 'react';
import { useAppSelector } from '../../app/store/hooks';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Search } from 'lucide-react-native';
import styled from 'styled-components/native';
import type { RootStackParamList } from '../../app/navigation/types';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { AppText } from '../primitives/AppText';
const Header = styled.View<{ $embedded: boolean }>(({ theme, $embedded }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.sm,
  paddingHorizontal: $embedded ? 0 : theme.spacing.md,
  paddingTop: $embedded ? 0 : theme.spacing.lg,
  paddingBottom: $embedded ? 0 : theme.spacing.xs,
  marginBottom: $embedded ? theme.spacing.sm : 0,
  backgroundColor: theme.dashboard.background,
}));
const Heading = styled.View(() => ({ flex: 1, gap: 0 }));
const Actions = styled.View(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing.sm + theme.spacing.xs,
}));
const Control = styled.Pressable.attrs({ hitSlop: 6 })<{ $avatar?: boolean }>(
  ({ theme, $avatar }) => ({
    width: theme.sizes.minimumTouchTarget,
    height: theme.sizes.minimumTouchTarget,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: $avatar
      ? theme.dashboard.accent
      : theme.dashboard.elevated,
  }),
);
const ModuleTitle = styled(AppText).attrs({
  variant: 'overviewTitle',
  numberOfLines: 1,
  adjustsFontSizeToFit: true,
  minimumFontScale: 0.8,
})(({ theme }) => ({ color: theme.dashboard.text, fontWeight: '700' }));
const Subtitle = styled(AppText)(({ theme }) => ({
  color: theme.dashboard.muted,
}));
const AvatarText = styled(AppText).attrs({ variant: 'label' })(({ theme }) => ({
  color: theme.dashboard.onAccent,
  fontWeight: '700',
}));
export function AppHeader({
  title = 'Home',
  subtitle,
  embedded = false,
}: {
  title?: string;
  subtitle?: string;
  embedded?: boolean;
}) {
  const name = useAppSelector(state => state.auth.user?.name);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useAppTheme();
  const showBack =
    String(navigation.getState().type) !== 'tab' && navigation.canGoBack();
  return (
    <Header $embedded={embedded}>
      {showBack ? (
        <Control
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={navigation.goBack}
        >
          <ArrowLeft size={20} color={theme.colors.primary} />
        </Control>
      ) : null}
      <Heading accessibilityLabel={title}>
        <ModuleTitle>{title}</ModuleTitle>
        {subtitle ? <Subtitle>{subtitle}</Subtitle> : null}
      </Heading>
      <Actions>
        <Control
          accessibilityRole="button"
          accessibilityLabel="Search everything"
          onPress={() => navigation.navigate('Search')}
        >
          <Search size={21} color={theme.dashboard.muted} />
        </Control>
        <Control
          $avatar
          accessibilityRole="button"
          accessibilityLabel="Account and settings"
          onPress={() => navigation.navigate('Settings')}
        >
          <AvatarText>{name?.trim().charAt(0).toUpperCase() || 'A'}</AvatarText>
        </Control>
      </Actions>
    </Header>
  );
}
