import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { AppText } from '../primitives/AppText';
import { BrandMark } from '../BrandMark';

export function LoadingState({
  label = 'Loading…',
  size = 36,
  fill = false,
  overlay = false,
}: {
  label?: string;
  size?: number;
  fill?: boolean;
  // Logo only, centred over the screen with no box or text. `fill` behaves the same way.
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

  if (overlay || fill) {
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: theme.colors.overlay.scrim }]}
      >
        <View
          style={[
            styles.box,
            { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default },
          ]}
        >
          <Animated.View style={{ opacity, transform: [{ scale }] }}>
            <BrandMark color={theme.colors.text.interactive} size={size} />
          </Animated.View>
          <AppText variant="labelMd" color="secondary">Loading</AppText>
        </View>
      </View>
    );
  }

  return (
    <View
      accessibilityRole="progressbar"
      style={styles.inline}
    >
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <BrandMark color={theme.colors.text.interactive} size={size} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  inline: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  overlay: { alignItems: 'center', justifyContent: 'center' },
  box: { alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radius.overlay, paddingHorizontal: 32, paddingVertical: 24 },
});
