import React from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  Home,
  Files,
  ListChecks,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { AppText } from '../primitives/AppText';
const Bar = styled.View<{ bottom: number }>(({ theme, bottom }) => ({
  height: theme.sizes.tabBar + bottom,
  paddingBottom: bottom,
  flexDirection: 'row',
  backgroundColor: theme.colors.surface,
  borderTopWidth: 1,
  borderTopColor: theme.colors.border,
}));
const Item = styled.Pressable(({ theme }) => ({
  flex: 1,
  minHeight: theme.sizes.minimumTouchTarget,
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing.xs,
}));
const icons = {
  Home,
  Documents: Files,
  Readiness: ListChecks,
  Trust: ShieldCheck,
  Profile: UserRound,
};
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();
  const { theme } = useAppTheme();
  return (
    <Bar bottom={bottom}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const Icon = icons[route.name as keyof typeof icons] ?? Home;
        const label = descriptors[route.key].options.title ?? route.name;
        return (
          <Item
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented)
                navigation.navigate(route.name, route.params);
            }}
          >
            <Icon
              size={theme.sizes.icon.md}
              color={focused ? theme.colors.primary : theme.colors.textMuted}
            />
            <AppText variant="caption" color={focused ? 'primary' : 'muted'}>
              {String(label)}
            </AppText>
          </Item>
        );
      })}
    </Bar>
  );
}
