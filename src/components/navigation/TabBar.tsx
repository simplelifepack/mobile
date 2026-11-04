import React from 'react';
import {
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { Archive, Files, Heart, House, PiggyBank } from 'lucide-react-native';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { sizes } from '../../design/tokens/sizes';
import { fontWeights } from '../../design/tokens/typography';
import { AppText } from '../primitives/AppText';

const PILL_HEIGHT = 64;

const Wrapper = styled.View<{ $bottomInset: number }>(
  ({ theme, $bottomInset }) => ({
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: PILL_HEIGHT + theme.spacing.md + $bottomInset,
    paddingBottom: $bottomInset,
    alignItems: 'center',
    justifyContent: 'flex-end',
  }),
);

const Pill = styled.View(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  width: '94%',
  maxWidth: 400,
  height: PILL_HEIGHT,
  paddingHorizontal: theme.spacing.xs,
  overflow: 'hidden',
  borderRadius: theme.radius.pill,
  borderWidth: 1,
  borderColor: theme.colors.border.emphasis,
  backgroundColor: theme.colors.surface.default,
}));

const Item = styled.Pressable({
  flex: 1,
  minHeight: sizes.minimumTouchTarget,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
});

const IconPill = styled.View(({ theme }) => ({
  width: 44,
  height: 36,
  borderRadius: theme.radius.pill,
  alignItems: 'center',
  justifyContent: 'center',
}));

const icons = {
  Home: House,
  Documents: Files,
  Packages: Archive,
  Health: Heart,
  Wealth: PiggyBank,
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
      <Pill>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const Icon = icons[route.name as keyof typeof icons] ?? House;
          const label = String(
            descriptors[route.key].options.title ?? route.name,
          );
          const tint = focused
            ? theme.colors.text.onBrand
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
                  focused && { backgroundColor: theme.colors.action.primary.default }
                }
              >
                <Icon size={theme.sizes.icon.md} color={tint} />
              </IconPill>
              <AppText
                variant="caption"
                numberOfLines={1}
                style={{
                  color: focused
                    ? theme.colors.text.interactive
                    : theme.colors.text.secondary,
                  fontWeight: focused
                    ? fontWeights.semibold
                    : fontWeights.medium,
                }}
              >
                {label}
              </AppText>
            </Item>
          );
        })}
      </Pill>
    </Wrapper>
  );
}
