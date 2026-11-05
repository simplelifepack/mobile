import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { radius } from '../../design/tokens/radius';
import { AppText } from '../primitives/AppText';
import { Stack } from '../primitives/Stack';

// Screen-level loading state: a caption and placeholder cards shown beneath the screen header.
export function SkeletonList({ label, rows = 4 }: { label: string; rows?: number }) {
  const { theme } = useAppTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const bar = { backgroundColor: theme.colors.surface.raised };

  return (
    <Stack gap="sm" accessibilityRole="progressbar" accessibilityLabel={label}>
      <AppText variant="label" color="secondary">{label}</AppText>
      {Array.from({ length: rows }, (_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface.default, borderColor: theme.colors.border.default, opacity },
          ]}
        >
          <View style={[styles.title, bar]} />
          <View style={[styles.subtitle, bar]} />
        </Animated.View>
      ))}
    </Stack>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.surface, padding: 16, gap: 12 },
  title: { height: 20, width: '72%', borderRadius: radius.control },
  subtitle: { height: 12, width: '42%', borderRadius: radius.control },
});
