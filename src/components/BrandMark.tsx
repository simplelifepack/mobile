import React from 'react';
import Svg, { Polygon } from 'react-native-svg';

export function BrandMark({
  color,
  size,
}: {
  color: string;
  size: number;
}) {
  return (
    <Svg
      width={size * (700 / 835)}
      height={size}
      viewBox="0 0 700 835"
      accessible={false}
    >
      <Polygon points="0,0 615,3 192,213 8,833 0,833" fill={color} />
      <Polygon points="320,375 700,145 700,835 415,835" fill={color} />
    </Svg>
  );
}