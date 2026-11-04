import React from 'react';
import Svg, {
  Polyline,
  Line,
  Circle,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { useAppTheme } from '../../design/theme/ThemeProvider';
import type { HealthMeasurement } from '../../api/web.types';
import { AppText, Stack } from '../shared/FeatureUI';
import { trendGeometry } from './trendGeometry';
export function MeasurementTrend({
  measurements,
  tone = 'primary',
}: {
  measurements: HealthMeasurement[];
  tone?: 'primary' | 'danger';
}) {
  const { theme } = useAppTheme();
  const chart = trendGeometry(measurements);
  if (!chart) return null;
  const { rows, points, min, max, limits, y } = chart;
  const latest = rows[rows.length - 1];
  return (
    <Stack gap="xs">
      <Svg
        width="100%"
        height={150}
        viewBox="0 0 360 150"
        accessibilityLabel={`Trend: ${rows.map(item => `${item.measuredAt?.slice(0, 10)}: ${item.value} ${item.unit}`).join(', ')}`}
      >
        {limits.length ? (
          <Rect
            x={38}
            width={300}
            y={y(latest.referenceMax ?? max)}
            height={Math.max(
              0,
              y(latest.referenceMin ?? min) - y(latest.referenceMax ?? max),
            )}
            fill={theme.colors.success}
            opacity={0.12}
          />
        ) : null}
        {limits.map((limit, index) => (
          <React.Fragment key={index}>
            <Line
              x1={38}
              x2={338}
              y1={y(limit)}
              y2={y(limit)}
              stroke={theme.colors.success}
              strokeDasharray="3 4"
            />
            <SvgText
              x={336}
              y={y(limit) - 4}
              textAnchor="end"
              fill={theme.colors.textSecondary}
              fontSize={theme.typography.caption.fontSize}
              fontFamily={theme.typography.caption.fontFamily}
              fontWeight={theme.typography.caption.fontWeight}
            >
              {limit} {latest.unit}
            </SvgText>
          </React.Fragment>
        ))}
        <Line x1={38} y1={122} x2={338} y2={122} stroke={theme.colors.border} />
        <Line x1={38} y1={20} x2={38} y2={122} stroke={theme.colors.border} />
        <SvgText
          x={31}
          y={26}
          textAnchor="end"
          fill={theme.colors.textMuted}
          fontSize={theme.typography.caption.fontSize}
          fontFamily={theme.typography.caption.fontFamily}
          fontWeight={theme.typography.caption.fontWeight}
        >
          {Number(max.toPrecision(3))}
        </SvgText>
        <SvgText
          x={31}
          y={122}
          textAnchor="end"
          fill={theme.colors.textMuted}
          fontSize={theme.typography.caption.fontSize}
          fontFamily={theme.typography.caption.fontFamily}
          fontWeight={theme.typography.caption.fontWeight}
        >
          {Number(min.toPrecision(3))}
        </SvgText>
        {points.length > 1 ? (
          <Polyline
            points={points.map(point => `${point.x},${point.y}`).join(' ')}
            fill="none"
            stroke={theme.colors[tone]}
            strokeWidth={2}
          />
        ) : null}
        {points.map((point, index) => (
          <Circle
            key={rows[index].id}
            cx={point.x}
            cy={point.y}
            r={3}
            fill={theme.colors[tone]}
          />
        ))}
      </Svg>
      <AppText variant="caption" color="muted">
        {rows[0].measuredAt?.slice(0, 10) || 'Undated'} —{' '}
        {latest.measuredAt?.slice(0, 10) || 'Undated'} · {rows.length}{' '}
        {rows.length === 1 ? 'reading' : 'readings'} · {latest.unit}
        {chart.sequential
          ? ' · Ordered by reading; spacing is not elapsed time'
          : ''}
      </AppText>
    </Stack>
  );
}
