import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import type { ExerciseProgressPoint } from '@/types/domain.types';
import { fromTimestamp } from '@/utils/dateUtils';
import { useTheme } from '@/context/ThemeContext';
import { Typography } from '@/constants/theme';

export type VolumeMetric = 'maxWeightKg' | 'totalVolumeKg' | 'totalReps' | 'estimatedOneRM';

interface VolumeChartProps {
  data: ExerciseProgressPoint[];
  metric: VolumeMetric;
  height?: number;
}

const PAD = { top: 12, right: 12, bottom: 32, left: 52 };

function getMetricValue(point: ExerciseProgressPoint, metric: VolumeMetric): number {
  return point[metric];
}

function formatY(value: number, metric: VolumeMetric): string {
  if (metric === 'totalReps') return `${Math.round(value)}`;
  return value >= 1000 ? `${(value / 1000).toFixed(1)}t` : `${value.toFixed(1)}kg`;
}

function formatXDate(ts: number): string {
  const d = fromTimestamp(ts);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function VolumeChart({ data, metric, height = 200 }: VolumeChartProps) {
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  if (data.length < 2) return null;

  const w = containerWidth;
  const h = height;
  const chartW = w - PAD.left - PAD.right;
  const chartH = h - PAD.top - PAD.bottom;

  if (w === 0 || chartW <= 0 || chartH <= 0) {
    return (
      <View
        style={{ height }}
        onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
      />
    );
  }

  const values = data.map(p => getMetricValue(p, metric));
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const pad = range * 0.15;
  const yMin = Math.max(0, minVal - pad);
  const yMax = maxVal + pad;

  const minDate = data[0].date;
  const maxDate = data[data.length - 1].date;
  const dateRange = maxDate - minDate || 1;

  const toX = (ts: number) => ((ts - minDate) / dateRange) * chartW;
  const toY = (v: number) => chartH - ((v - yMin) / (yMax - yMin)) * chartH;

  const pathD = data
    .map((p, i) => {
      const x = toX(p.date);
      const y = toY(getMetricValue(p, metric));
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const ySteps = Array.from({ length: 4 }, (_, i) => yMin + (yMax - yMin) * (i / 3));

  const xLabels = [
    data[0],
    data[Math.floor(data.length / 2)],
    data[data.length - 1],
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <View
      style={{ height }}
      onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Svg width={w} height={h}>
        <G transform={`translate(${PAD.left}, ${PAD.top})`}>
          {ySteps.map((val, i) => {
            const y = toY(val);
            return (
              <G key={i}>
                <Line
                  x1={0}
                  y1={y}
                  x2={chartW}
                  y2={y}
                  stroke={colors.border}
                  strokeWidth={1}
                />
                <SvgText
                  x={-4}
                  y={y + 4}
                  fontSize={Typography.fontSize.xs}
                  fill={colors.textSecondary}
                  textAnchor="end"
                >
                  {formatY(val, metric)}
                </SvgText>
              </G>
            );
          })}

          <Path
            d={pathD}
            stroke={colors.primary}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {data.map((p, i) => (
            <Circle
              key={i}
              cx={toX(p.date)}
              cy={toY(getMetricValue(p, metric))}
              r={3.5}
              fill={colors.primary}
            />
          ))}

          {xLabels.map((p, i) => {
            const x = toX(p.date);
            const anchor = i === 0 ? 'start' : i === xLabels.length - 1 ? 'end' : 'middle';
            return (
              <SvgText
                key={i}
                x={x}
                y={chartH + 18}
                fontSize={Typography.fontSize.xs}
                fill={colors.textSecondary}
                textAnchor={anchor}
              >
                {formatXDate(p.date)}
              </SvgText>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}
