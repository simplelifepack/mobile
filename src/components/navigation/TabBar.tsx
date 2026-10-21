import React from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  HeartPulse,
  LayoutGrid,
  Plane,
  Wallet,
  FolderOpen,
} from 'lucide-react-native';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { space } from '../../design/tokens/spacing';
import { AppText } from '../primitives/AppText';
const Bar = styled.View<{
  $bottomInset: number;
  $leftInset: number;
  $rightInset: number;
}>(({ theme, $bottomInset, $leftInset, $rightInset }) => ({
  height: theme.sizes.tabBar + $bottomInset,
  paddingTop: space[2],
  paddingBottom: $bottomInset,
  paddingLeft: Math.max(space[8], $leftInset),
  paddingRight: Math.max(space[8], $rightInset),
  flexDirection: 'row',
  backgroundColor: theme.colors.surface,
  borderTopWidth: 1,
  borderTopColor: theme.colors.border,
}));
const Item = styled.Pressable<{ $active: boolean }>(({ theme, $active }) => ({
  flex: 1,
  minHeight: theme.sizes.minimumTouchTarget,
  marginHorizontal: space[2],
  borderRadius: 14,
  backgroundColor: $active ? theme.colors.surfaceElevated : 'transparent',
  alignItems: 'center',
  justifyContent: 'center',
  gap: space[4],
}));
const icons = {
  Home: LayoutGrid,
  Documents: FolderOpen,
  Packages: Plane,
  Health: HeartPulse,
  Wealth: Wallet,
};
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Bar
      $bottomInset={insets.bottom}
      $leftInset={insets.left}
      $rightInset={insets.right}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const Icon = icons[route.name as keyof typeof icons] ?? LayoutGrid;
        const label = descriptors[route.key].options.title ?? route.name;
        return (
          <Item
            key={route.key}
            $active={focused}
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
              size={20}
              color={focused ? theme.colors.primary : theme.colors.textMuted}
            />
            <AppText
              variant="caption"
              color={focused ? 'primary' : 'muted'}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              style={styles.label}
            >
              {String(label)}
            </AppText>
          </Item>
        );
      })}
    </Bar>
  );
}

const styles = {
  label: {
    flexShrink: 1,
    textAlign: 'center' as const,
  },
};
