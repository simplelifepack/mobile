import React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';
import { useAppTheme } from '../../design/theme/ThemeProvider';
// Exact artwork from frontend-web/public/icons/favicon.svg.
export function BrandMark({ size = 30 }: { size?: number }) {
  const { theme } = useAppTheme();
  return (
    <Svg
      width={size}
      height={(size * 337) / 336}
      viewBox="0 0 336 337"
      accessibilityRole="image"
      accessibilityLabel="Readines logo"
    >
      <Rect width="336" height="337" rx="74" fill={theme.colors.primary} />
      <Path fill={theme.colors.onPrimary} d="M94 80H221L133 124L94 256Z" />
      <Path fill={theme.colors.onPrimary} d="M241 112V257H183L163 159Z" />
    </Svg>
  );
}
