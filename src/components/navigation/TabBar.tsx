import React from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Files, Archive, Heart, PiggyBank } from 'lucide-react-native';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { AppText } from '../primitives/AppText';
import type { MainTabParamList } from '../../app/navigation/types';
const Bar = styled.View<{ $bottom: number }>(({ theme, $bottom }) => ({
  position: 'absolute',
  left: theme.spacing.md,
  right: theme.spacing.md,
  bottom: Math.max($bottom, theme.spacing.sm),
  minHeight: theme.sizes.tabBar,
  paddingHorizontal: theme.spacing.sm,
  flexDirection: 'row',
  borderWidth: 1,
  borderColor: theme.colors.controlBorder,
  borderRadius: theme.radius.pill,
  backgroundColor: theme.colors.surfaceElevated,
  ...theme.shadows.floating,
}));
const Item = styled.Pressable(({ theme }) => ({
  flex: 1,
  minHeight: theme.sizes.minimumTouchTarget,
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing.xs,
  marginVertical: theme.spacing.xs,
}));
const IconPill = styled.View<{ $focused: boolean }>(({ theme, $focused }) => ({
  width: 44,
  height: 30,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.radius.tabIndicator,
  overflow: 'hidden',
  backgroundColor: $focused ? theme.colors.primary : 'transparent',
}));
const Label = styled(AppText).attrs({
  variant: 'navigation',
  numberOfLines: 1,
})<{ $focused: boolean }>(({ theme, $focused }) => ({
  color: $focused ? theme.colors.primary : theme.colors.textMuted,
}));
const destinations = [
  { name: 'Home', label: 'Home', Icon: Home },
  { name: 'Documents', label: 'Documents', Icon: Files },
  { name: 'Readiness', label: 'Packages', Icon: Archive },
  { name: 'Health', label: 'Health', Icon: Heart },
  { name: 'Wealth', label: 'Wealth', Icon: PiggyBank },
] as const;
export function PrimaryNavigation({
  active,
  onSelect,
}: {
  active?: string;
  onSelect: (name: keyof MainTabParamList) => void;
}) {
  const { bottom } = useSafeAreaInsets();
  const { theme } = useAppTheme();
  return (
    <Bar $bottom={bottom}>
      {destinations.map(({ name, label, Icon }) => {
        const focused = active === name;
        return (
          <Item
            key={name}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={() => onSelect(name)}
          >
            <IconPill $focused={focused}>
              <Icon
                size={19}
                color={
                  focused ? theme.colors.onPrimary : theme.colors.textMuted
                }
              />
            </IconPill>
            <Label $focused={focused}>{label}</Label>
          </Item>
        );
      })}
    </Bar>
  );
}
export function TabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <PrimaryNavigation
      active={state.routes[state.index].name}
      onSelect={name => {
        const route = state.routes.find(item => item.name === name);
        if (!route) return;
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });
        if (
          state.routes[state.index].key !== route.key &&
          !event.defaultPrevented
        )
          navigation.navigate(route.name, route.params);
      }}
    />
  );
}
