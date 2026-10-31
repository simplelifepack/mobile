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
import { BlurView } from '@react-native-community/blur';
import styled from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../primitives/AppText';
const Wrapper = styled.View<{ $bottomInset: number }>(({ $bottomInset }) => ({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: 76 + $bottomInset,
  paddingBottom: $bottomInset,
  alignItems: 'center',
  backgroundColor: 'transparent',
}));
const Pill = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  width: '94%',
  maxWidth: 370,
  height: 64,
  paddingHorizontal: 12,
  paddingVertical: 10,
  backgroundColor: 'rgba(255,255,255,0.03)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.22)',
  borderTopColor: 'rgba(255,255,255,0.4)',
  overflow: 'hidden',
  borderRadius: 32,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.45,
  shadowRadius: 24,
  elevation: 8,
});
const Item = styled.Pressable({
  flex: 1,
  height: 44,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 3,
});
const IconChip = styled.View<{ $active: boolean }>(({ $active }) => ({
  width: 44,
  height: 30,
  borderRadius: 15,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: $active ? '#A784DE' : 'transparent',
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
  const reportHeight = React.useContext(BottomTabBarHeightCallbackContext);
  return (
    <Wrapper
      $bottomInset={insets.bottom}
      onLayout={e => reportHeight?.(e.nativeEvent.layout.height)}
    >
      <Pill>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={Platform.OS === 'ios' ? 'ultraThinMaterialDark' : 'dark'}
          blurAmount={8}
          reducedTransparencyFallbackColor="transparent"
        />
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const Icon = icons[route.name as keyof typeof icons] ?? LayoutGrid;
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
              <IconChip $active={focused}>
                <Icon size={18} color={focused ? '#2F6FDB' : '#919193'} />
              </IconChip>
              <AppText
                variant="caption"
                numberOfLines={1}
                style={[
                  styles.label,
                  {
                    fontSize: 10,
                    lineHeight: 12,
                    fontWeight: focused ? '600' : '400',
                    color: focused ? '#B79BE6' : 'rgba(255,255,255,0.45)',
                  },
                ]}
              >
                {String(label)}
              </AppText>
            </Item>
          );
        })}
      </Pill>
    </Wrapper>
  );
}

const styles = {
  label: {
    flexShrink: 1,
    textAlign: 'center' as const,
  },
};
