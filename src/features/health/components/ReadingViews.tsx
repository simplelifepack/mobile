import React from 'react';
import {
View
} from 'react-native';

import {
FileText
} from 'lucide-react-native';

import Svg,{
Circle,
Polyline,
} from 'react-native-svg';


import { useAppTheme } from '../../../design/theme/ThemeProvider';

import { AppText } from '../../../components/primitives/AppText';
import { Card } from '../../../components/primitives/Card';
import { Row } from '../../../components/primitives/Row';
import { StatusBadge } from '../../../components/feedback/StatusBadge';
import { styles } from '../healthStyles';
import { ReadingView } from '../healthTypes';
import { sizes } from '../../../design/tokens/sizes';

export function TrendChart({
  values,
  color,
  labels,
  range,
}: {
  values: number[];
  color: string;
  labels: string[];
  range?: string;
}) {
  const { theme } = useAppTheme();

  const width = 340;
  const height = 92;

  const left = 30;
  const right = 10;
  const top = 8;
  const bottom = 20;

  const chartWidth =
    width - left - right;

  const chartHeight =
    height - top - bottom;

  const min =
    Math.min(...values);

  const max =
    Math.max(...values);

  const spread =
    max - min || 1;

  const points = values.map(
    (value, index) => {
      const x =
        left +
        (chartWidth *
          index) /
          Math.max(
            values.length - 1,
            1,
          );

      const y =
        top +
        chartHeight -
        ((value - min) /
          spread) *
          chartHeight;

      return `${x},${y}`;
    },
  );

  return (
    <View
      style={styles.chartContainer}
    >
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        <Circle
          cx={left}
          cy={height - bottom}
          r={2}
          fill={theme.colors.border.default}
        />

        <Polyline
          points={points.join(
            ' ',
          )}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {values.map(
          (value, index) => {
            const [
              x,
              y,
            ] = points[
              index
            ]
              .split(',')
              .map(Number);

            return (
              <Circle
                key={`${value}-${index}`}
                cx={x}
                cy={y}
                r={
                  index ===
                  values.length - 1
                    ? 5
                    : 3
                }
                fill={color}
              />
            );
          },
        )}
      </Svg>

      <View
        style={
          styles.chartLabels
        }
      >
        <AppText
          variant="caption"
          color="muted"
        >
          {labels[0]}
        </AppText>

        <AppText
          variant="caption"
          color="muted"
        >
          {labels[labels.length - 1]}
        </AppText>
      </View>

      {range ? (
        <AppText
          variant="caption"
          style={[
            styles.chartRange,
            {
              color:
                theme.colors.status.success.text,
            },
          ]}
        >
          printed range ≤{' '}
          {range.replace(
            'under ',
            '',
          )}
        </AppText>
      ) : null}
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

  const lineColor =
    reading.color ===
    'danger'
      ? theme.colors.status.danger.text
      : theme.colors.text.interactive;

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
          variant="title"
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

      <TrendChart
        values={
          reading.values
        }
        color={lineColor}
        labels={
          reading.dates
        }
        range={
          reading.range
        }
      />

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
