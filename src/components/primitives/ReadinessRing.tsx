import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import styled from 'styled-components/native';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import { AppText } from './AppText';
const Frame = styled.View<{ $size: number }>(({ $size }) => ({
  width: $size,
  height: $size,
  alignItems: 'center',
  justifyContent: 'center',
}));
const Value = styled(AppText)(() => ({ position: 'absolute' }));
export function ReadinessRing({
  score,
  size = 48,
}: {
  score: number;
  size?: number;
}) {
  const { theme } = useAppTheme();
  const value = Number.isFinite(score)
    ? Math.min(100, Math.max(0, Math.round(score)))
    : 0;
  const radius = (size - 4) / 2,
    circumference = 2 * Math.PI * radius;
  return (
    <Frame
      $size={size}
      accessibilityRole="image"
      accessibilityLabel={`Readines ${value}%`}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.colors.surfaceElevated}
          strokeWidth={4}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={
            value === 100
              ? theme.colors.success
              : value >= 40
                ? theme.colors.warning
                : theme.colors.danger
          }
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Value variant="label">{value}</Value>
    </Frame>
  );
}
