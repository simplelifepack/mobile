import React from 'react';
import { BrandMark } from './BrandMark';
import { useAppTheme } from '../design/theme/ThemeProvider';

// The locked ReadiNes mark, coloured from the logo token so it works in both themes.
export function BrandLogo({ size = 26 }: { size?: number }) {
  const { theme } = useAppTheme();
  return <BrandMark size={size} color={theme.colors.logo.default} />;
}
