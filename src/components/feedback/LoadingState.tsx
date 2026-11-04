import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { darkTheme } from '../../design/theme/dark';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { BrandMark } from '../BrandMark';
import { AppText } from '../primitives/AppText';
import { Stack } from '../primitives/Stack';

export function LoadingState({
  label = 'Loading…',
  size = 36,
  fill = false,
  overlay = false,
}: {
  label?: string;
  size?: number;
  fill?: boolean;
  // Logo only, centred over the screen with no box or text.
  overlay?: boolean;
}) {
  const { theme } = useAppTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.85, 1.1, 0.85],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.45, 1, 0.45],
  });

  if (overlay) {
    const dark = theme === darkTheme;
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      >
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={Platform.OS === 'ios' ? (dark ? 'ultraThinMaterialDark' : 'ultraThinMaterialLight') : dark ? 'dark' : 'light'}
          blurAmount={10}
          reducedTransparencyFallbackColor={theme.colors.surface.canvas}
        />
        <View style={styles.overlayLogo}>
          <Animated.View style={{ opacity, transform: [{ scale }] }}>
            <BrandMark color={theme.colors.text.interactive} size={size} />
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View
      accessibilityRole="progressbar"
      style={
        fill
          ? { flex: 1, alignItems: 'center', justifyContent: 'center' }
          : { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }
      }
    >
      <Stack align="center" gap="sm">
        <AppText variant="caption" color="muted">
          {label}
        </AppText>
        <Animated.View style={{ opacity, transform: [{ scale }] }}>
          <BrandMark color={theme.colors.text.interactive} size={size} />
        </Animated.View>
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayLogo: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
