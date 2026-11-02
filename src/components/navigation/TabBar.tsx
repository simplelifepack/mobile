import React from 'react';
import { Platform, StyleSheet } from 'react-native';
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
import { BlurView } from '@react-native-community/blur';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { darkTheme } from '../../design/theme/dark';
import { shadows } from '../../design/tokens/shadows';
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
  width: '92%',
  maxWidth: 400,
  height: PILL_HEIGHT,
  paddingHorizontal: theme.spacing.sm,
  overflow: 'hidden',
  borderRadius: theme.radius.pill,
  borderWidth: 1,
  borderColor: theme.colors.overlay.glassBorder,
  borderTopColor: theme.colors.overlay.glassEdge,
  backgroundColor: theme.colors.overlay.glass,
  ...shadows.floating,
}));

const Item = styled.Pressable({
  flex: 1,
  minHeight: sizes.minimumTouchTarget,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
});

const IconPill = styled.View(({ theme }) => ({
  width: 56,
  height: 30,
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
      <Pill>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={
            theme === darkTheme
              ? Platform.OS === 'ios'
                ? 'ultraThinMaterialDark'
                : 'dark'
              : Platform.OS === 'ios'
                ? 'ultraThinMaterialLight'
                : 'light'
          }
          blurAmount={10}
          reducedTransparencyFallbackColor={theme.colors.surface.default}
        />
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const Icon = icons[route.name as keyof typeof icons] ?? LayoutGrid;
          const label = String(
            descriptors[route.key].options.title ?? route.name,
          );
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
