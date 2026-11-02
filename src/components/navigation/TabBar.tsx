import React from 'react';
import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
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
import { AppText } from '../primitives/AppText';

const Wrapper = styled.View<{ $bottomInset: number }>(
  ({ theme, $bottomInset }) => ({
    flexDirection: 'row',
    height: theme.sizes.tabBar + $bottomInset,
    paddingBottom: $bottomInset,
    backgroundColor: theme.colors.surface.default,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  }),
);

const Item = styled.Pressable({
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
});

const IconPill = styled.View(({ theme }) => ({
  width: 56,
  height: 28,
  borderRadius: theme.radius.pill,
  alignItems: 'center',
  justifyContent: 'center',
}));

const icons = {
  Home: LayoutGrid,
  Documents: FolderOpen,
  Packages: Plane,
  Health: HeartPulse,
  Wealth: Wallet,
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const reportHeight = React.useContext(BottomTabBarHeightCallbackContext);
  return (
    <Wrapper
      $bottomInset={insets.bottom}
      onLayout={e => reportHeight?.(e.nativeEvent.layout.height)}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const Icon = icons[route.name as keyof typeof icons] ?? LayoutGrid;
        const label = String(descriptors[route.key].options.title ?? route.name);
        const tint = focused
          ? theme.colors.icon.interactive
          : theme.colors.icon.secondary;
        return (
          <Item
            key={route.key}
            accessibilityRole="button"
            accessibilityLabel={label}
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
            <IconPill
              style={
                focused && { backgroundColor: theme.colors.surface.brandTint }
              }
            >
              <Icon size={theme.sizes.icon.lg} color={tint} />
            </IconPill>
            <AppText
              variant="caption"
              numberOfLines={1}
              style={{
                color: focused
                  ? theme.colors.text.interactive
                  : theme.colors.text.secondary,
                fontWeight: focused ? '600' : '500',
              }}
            >
              {label}
            </AppText>
          </Item>
        );
      })}
    </Wrapper>
  );
}
