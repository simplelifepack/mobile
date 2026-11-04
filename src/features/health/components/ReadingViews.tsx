import React from 'react';
import {
View
} from 'react-native';

import {
FileText
} from 'lucide-react-native';

import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import type { HealthMeasurement } from '../../../api/health.api';
import { trendGeometry, CHART } from '../trendGeometry';


import { useAppTheme } from '../../../design/theme/ThemeProvider';

import { AppText } from '../../../components/primitives/AppText';
import { Card } from '../../../components/primitives/Card';
import { Row } from '../../../components/primitives/Row';
import { StatusBadge } from '../../../components/feedback/StatusBadge';
import { styles } from '../healthStyles';
import { ReadingView } from '../healthTypes';
import { sizes } from '../../../design/tokens/sizes';

export function TrendChart({
  measurements,
  tone,
}: {
  measurements: HealthMeasurement[];
  tone: 'danger' | 'primary';
}) {
  const { theme } = useAppTheme();
  const chart = trendGeometry(measurements);
  if (!chart) return null;

  const { rows, points, min, max, limits, y, sequential } = chart;
  const latest = rows[rows.length - 1];
  const stroke = tone === 'danger' ? theme.colors.status.danger.text : theme.colors.text.interactive;
  const rangeColor = theme.colors.status.success.text;
  const axis = theme.colors.border.default;
  const labelProps = {
    fill: theme.colors.text.tertiary,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: theme.typography.caption.fontWeight,
  };
  const day = (value: string | null) => value?.slice(0, 10) || 'Undated';

  return (
    <View>
      <Svg
        width="100%"
        height={CHART.height}
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        accessibilityLabel={`Trend: ${rows.map(row => `${day(row.measuredAt)}: ${row.value} ${row.unit}`).join(', ')}`}
      >
        {limits.length ? (
          <Rect
            x={CHART.left}
            width={CHART.right - CHART.left}
            y={y(latest.referenceMax ?? max)}
            height={Math.max(0, y(latest.referenceMin ?? min) - y(latest.referenceMax ?? max))}
            fill={rangeColor}
            opacity={0.12}
          />
        ) : null}
        {limits.map(limit => (
          <React.Fragment key={limit}>
            <Line
              x1={CHART.left}
              x2={CHART.right}
              y1={y(limit)}
              y2={y(limit)}
              stroke={rangeColor}
              strokeDasharray="3 4"
            />
            <SvgText x={CHART.right - 2} y={y(limit) - 4} textAnchor="end" {...labelProps}>
              {limit} {latest.unit}
            </SvgText>
          </React.Fragment>
        ))}
        <Line x1={CHART.left} y1={CHART.bottom} x2={CHART.right} y2={CHART.bottom} stroke={axis} />
        <Line x1={CHART.left} y1={CHART.top} x2={CHART.left} y2={CHART.bottom} stroke={axis} />
        <SvgText x={CHART.left - 7} y={CHART.top + 6} textAnchor="end" {...labelProps}>
          {Number(max.toPrecision(3))}
        </SvgText>
        <SvgText x={CHART.left - 7} y={CHART.bottom} textAnchor="end" {...labelProps}>
          {Number(min.toPrecision(3))}
        </SvgText>
        {points.length > 1 ? (
          <Polyline
            points={points.map(point => `${point.x},${point.y}`).join(' ')}
            fill="none"
            stroke={stroke}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ) : null}
        {points.map((point, index) => (
          <Circle key={rows[index].id} cx={point.x} cy={point.y} r={index === points.length - 1 ? 5 : 3} fill={stroke} />
        ))}
      </Svg>
      <AppText variant="caption" color="muted">
        {day(rows[0].measuredAt)} — {day(latest.measuredAt)} · {rows.length} {rows.length === 1 ? 'reading' : 'readings'}
        {sequential ? ' · Ordered by reading; spacing is not elapsed time' : ''}
      </AppText>
    </View>
  );
}


// ============================================================================
// READING CARD
// ============================================================================

export function ReadingCard({
  reading,
}: {
  reading: ReadingView;
}) {
  const { theme } = useAppTheme();

  return (
    <Card
      style={
        styles.readingCard
      }
    >
      <Row
        align="center"
        justify="space-between"
        gap="sm"
      >
        <AppText
          variant="body"
          color="secondary"
          style={
            styles.readingTitle
          }
          numberOfLines={2}
        >
          {reading.title}
        </AppText>

        {reading.status !== 'no range on file' ? (
          <StatusBadge
            label={reading.status}
            status={reading.status === 'outside printed range' ? 'danger' : 'success'}
          />
        ) : (
          <AppText
            variant="caption"
            color="muted"
            style={
              styles.noRangeText
            }
          >
            no range on
            {'\n'}
            file
          </AppText>
        )}
      </Row>

      <Row
        align="center"
        gap="sm"
      >
        <AppText
          variant="numeric"
          style={
            styles.readingValue
          }
        >
          {reading.value}
        </AppText>

        <AppText
          variant="body"
          color="secondary"
        >
          {reading.unit}
        </AppText>

        <AppText
          variant="caption"
          color="muted"
          style={
            styles.rangeText
          }
          numberOfLines={1}
        >
          {reading.range
            ? `range on this report: ${reading.range}`
            : 'no range printed on the report'}
        </AppText>
      </Row>

      <TrendChart measurements={reading.measurements} tone={reading.color} />

      <Row
        align="center"
        justify="space-between"
        gap="sm"
      >
        <Row
          align="center"
          gap="xs"
          style={
            styles.sourceRow
          }
        >
          <FileText
            size={sizes.icon.sm}
            color={
              theme.colors.text.tertiary
            }
          />

          <AppText
            variant="caption"
            color="muted"
            numberOfLines={1}
            style={
              styles.sourceText
            }
          >
            {reading.sourceName ?? 'Health measurement'}
          </AppText>
        </Row>

        <AppText variant="caption" color="muted">
          Latest
        </AppText>
      </Row>
    </Card>
  );
}


// ============================================================================
// REMINDERS
// ============================================================================
