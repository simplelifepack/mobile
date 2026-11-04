import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { useAppTheme } from '../../design/theme/ThemeProvider';
export type EmptyArtworkKind =
  'documents' | 'health' | 'wealth' | 'packages' | 'people' | 'search';
const drawings: Record<EmptyArtworkKind, string[]> = {
  documents: [
    'M49 29h37l15 16v49H49z',
    'M86 29v17h15',
    'M60 60h29M60 70h22M60 80h16',
  ],
  health: [
    'M50 34h44a8 8 0 0 1 8 8v43a8 8 0 0 1-8 8H50a8 8 0 0 1-8-8V42a8 8 0 0 1 8-8z',
    'M62 28h20v12H62z',
    'M72 54v23M60 65h24',
  ],
  wealth: [
    'M40 43h62v45H40z',
    'M40 43v-8l53-6v14',
    'M85 58h23v16H85z',
    'M94 65h3',
  ],
  packages: [
    'M40 43l32-16 32 16-32 17z',
    'M40 43v36l32 17 32-17V43',
    'M72 60v36M56 35l32 17v17',
  ],
  people: [
    'M69 42a13 13 0 1 1-26 0 13 13 0 0 1 26 0z',
    'M29 86c0-17 11-26 27-26s27 9 27 26',
    'M91 37a12 12 0 0 1 0 24M91 68c15 0 24 8 24 20',
  ],
  search: [
    'M86 56a24 24 0 1 1-48 0 24 24 0 0 1 48 0z',
    'M81 75l24 23',
    'M50 56h24',
  ],
};
export function artworkFor(title: string): EmptyArtworkKind {
  if (/match|search|filter/i.test(title)) return 'search';
  if (/health|test|reading|medicine|medication|reminder|profile/i.test(title))
    return 'health';
  if (/wealth|account|loan|polic|insurance/i.test(title)) return 'wealth';
  if (/pack|catalog/i.test(title)) return 'packages';
  if (/people|trusted|shared|recipient|member|connection/i.test(title))
    return 'people';
  return 'documents';
}

export function EmptyArtwork({
  kind,
  compact = false,
}: {
  kind: EmptyArtworkKind;
  compact?: boolean;
}) {
  const { theme } = useAppTheme();
  return (
    <Svg
      width={compact ? 96 : 144}
      height={compact ? 76 : 112}
      viewBox="0 0 144 112"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Ellipse
        cx={72}
        cy={100}
        rx={40}
        ry={5}
        fill={theme.colors.border}
        opacity={0.4}
      />
      <Circle cx={72} cy={57} r={43} fill={theme.colors.primarySoft} />
      <Circle cx={20} cy={41} r={4} fill={theme.colors.primarySoft} />
      <Circle cx={122} cy={78} r={6} fill={theme.colors.primarySoft} />
      <Rect
        x={31}
        y={40}
        width={57}
        height={51}
        rx={8}
        fill={theme.colors.surface}
        opacity={0.7}
        transform="rotate(-12 31 40)"
      />
      <G
        fill={theme.colors.surface}
        stroke={theme.colors.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {drawings[kind].map((d, index) => (
          <Path
            key={d}
            d={d}
            fill={index === 0 ? theme.colors.surface : 'none'}
          />
        ))}
      </G>
      <Circle
        cx={111}
        cy={31}
        r={12}
        fill={theme.colors.surface}
        stroke={theme.colors.border}
      />
      <Path
        d="M107 31h8M111 27v8"
        stroke={theme.colors.primary}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
