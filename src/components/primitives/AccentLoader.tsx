import React from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import styled from 'styled-components/native';
import { useAppTheme } from '../../design/theme/ThemeProvider';

const Ring = styled(Animated.View)<{ $size: number }>(({ $size }) => ({
  width: $size,
  height: $size,
}));

/** Lightweight shared activity indicator with reduced-motion support. */
export function AccentLoader({ size = 32 }: { size?: number }) {
  const { theme } = useAppTheme();
  const rotation = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    let active = true;
    let preferenceChanged = false;
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
        isInteraction: false,
      }),
    );
    const update = (reduced: boolean) => {
      if (!active) return;
      animation.stop();
      animation.reset();
      rotation.setValue(0);
      if (!reduced) animation.start();
    };
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      reduced => {
        preferenceChanged = true;
        update(reduced);
      },
    );
    AccessibilityInfo.isReduceMotionEnabled()
      .then(reduced => {
        if (!preferenceChanged) update(reduced);
      })
      .catch(() => {
        if (!preferenceChanged) update(true);
      });
    return () => {
      active = false;
      animation.stop();
      subscription.remove();
    };
  }, [rotation]);
  const stroke = Math.max(1.5, Math.min(2.5, size * 0.065));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <Ring
      $size={size}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      accessibilityState={{ busy: true }}
      style={{
        transform: [
          {
            rotate: rotation.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '360deg'],
            }),
          },
        ],
      }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.dashboard.accent}
          strokeOpacity={0.12}
          strokeWidth={stroke}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.dashboard.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.28} ${circumference * 0.72}`}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
    </Ring>
  );
}
