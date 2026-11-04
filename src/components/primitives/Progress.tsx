import React from 'react';
import styled from 'styled-components/native';
const Track = styled.View(({ theme }) => ({
  height: 8,
  borderRadius: theme.radius.pill,
  backgroundColor: theme.colors.surfaceElevated,
  overflow: 'hidden',
}));
const Fill = styled.View<{ $value: number; $tone: 'readiness' | 'warning' }>(
  ({ theme, $value, $tone }) => ({
    height: '100%',
    width: `${Math.max(0, Math.min(100, $value))}%`,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors[$tone],
  }),
);
export function Progress({
  value,
  label,
  tone = 'readiness',
}: {
  value: number;
  label: string;
  tone?: 'readiness' | 'warning';
}) {
  return (
    <Track
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: value }}
    >
      <Fill $value={value} $tone={tone} />
    </Track>
  );
}
