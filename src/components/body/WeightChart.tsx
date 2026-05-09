import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G, Rect } from 'react-native-svg';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '@/context/ThemeContext';
import { Typography } from '@/constants/theme';
import type { BodyWeightRow } from '@/types/database.types';

const PAD = { top: 12, right: 12, bottom: 32, left: 44 };

function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } | null {
  const n = points.length;
  if (n < 2) return null;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

type ChartPoint = { date: number; weight_kg: number };

function aggregateWeekly(data: BodyWeightRow[]): ChartPoint[] {
  const map = new Map<string, { sum: number; count: number; ts: number }>();
  for (const w of data) {
    const d = new Date(w.date * 1000);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    const key = `${monday.getFullYear()}-${monday.getMonth()}-${monday.getDate()}`;
    const ts = Math.floor(monday.getTime() / 1000);
    if (!map.has(key)) map.set(key, { sum: 0, count: 0, ts });
    const e = map.get(key)!;
    e.sum += w.weight_kg;
    e.count++;
  }
  return Array.from(map.values())
    .sort((a, b) => a.ts - b.ts)
    .map(v => ({ date: v.ts, weight_kg: v.sum / v.count }));
}

function aggregateMonthly(data: BodyWeightRow[]): ChartPoint[] {
  const map = new Map<string, { sum: number; count: number; ts: number }>();
  for (const w of data) {
    const d = new Date(w.date * 1000);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const firstOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    const ts = Math.floor(firstOfMonth.getTime() / 1000);
    if (!map.has(key)) map.set(key, { sum: 0, count: 0, ts });
    const e = map.get(key)!;
    e.sum += w.weight_kg;
    e.count++;
  }
  return Array.from(map.values())
    .sort((a, b) => a.ts - b.ts)
    .map(v => ({ date: v.ts, weight_kg: v.sum / v.count }));
}

interface WeightChartProps {
  data: BodyWeightRow[];
  height?: number;
  goalWeight?: number | null;
  viewMode?: 'daily' | 'weekly' | 'monthly';
}

export function WeightChart({ data, height = 200, goalWeight, viewMode = 'daily' }: WeightChartProps) {
  const { colors } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeTip, setActiveTip] = useState<number | null>(null);

  const sorted = [...data].sort((a, b) => a.date - b.date);

  const chartPoints: ChartPoint[] =
    viewMode === 'weekly'
      ? aggregateWeekly(sorted)
      : viewMode === 'monthly'
      ? aggregateMonthly(sorted)
      : sorted;

  if (chartPoints.length < 2) {
    return (
      <View
        style={[styles.empty, { height, backgroundColor: colors.surfaceElevated }]}
        onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
      >
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Necesitas al menos 2 registros para ver la gráfica
        </Text>
      </View>
    );
  }

  const cw = containerWidth - PAD.left - PAD.right;
  const ch = height - PAD.top - PAD.bottom;

  const weights = chartPoints.map(d => d.weight_kg);
  const allY = goalWeight != null ? [...weights, goalWeight] : weights;
  const minW = Math.min(...allY);
  const maxW = Math.max(...allY);
  const rawRange = maxW - minW || 1;
  const pad = rawRange * 0.15;
  const lo = minW - pad;
  const hi = maxW + pad;
  const range = hi - lo;

  const minDate = chartPoints[0].date;
  const maxDate = chartPoints[chartPoints.length - 1].date;
  const dateRange = maxDate - minDate || 1;

  const toX = (d: number) => ((d - minDate) / dateRange) * cw;
  const toY = (w: number) => ch - ((w - lo) / range) * ch;

  const pathD = chartPoints
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(d.date).toFixed(1)},${toY(d.weight_kg).toFixed(1)}`)
    .join(' ');

  const trend = chartPoints.length >= 3
    ? linearRegression(chartPoints.map(p => ({ x: p.date, y: p.weight_kg })))
    : null;
  const trendStart = trend ? trend.slope * minDate + trend.intercept : 0;
  const trendEnd = trend ? trend.slope * maxDate + trend.intercept : 0;

  const yLabels = Array.from({ length: 4 }, (_, i) => {
    const w = minW + (rawRange / 3) * i;
    return { value: w, y: toY(w) };
  });

  const xCandidates = [
    chartPoints[0],
    chartPoints[Math.floor((chartPoints.length - 1) / 2)],
    chartPoints[chartPoints.length - 1],
  ];
  const xLabels = xCandidates.filter((d, i, arr) => arr.findIndex(x => x.date === d.date) === i);

  return (
    <View
      style={{ width: '100%', height }}
      onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && cw > 0 && ch > 0 && (
        <Svg width={containerWidth} height={height}>
          <G transform={`translate(${PAD.left}, ${PAD.top})`}>
            {yLabels.map((l, i) => (
              <Line
                key={`grid-${i}`}
                x1={0}
                y1={l.y}
                x2={cw}
                y2={l.y}
                stroke={colors.border}
                strokeWidth={1}
              />
            ))}

            {yLabels.map((l, i) => (
              <SvgText
                key={`ylabel-${i}`}
                x={-6}
                y={l.y + 4}
                textAnchor="end"
                fontSize={9}
                fill={colors.textSecondary}
              >
                {l.value.toFixed(1)}
              </SvgText>
            ))}

            {goalWeight != null && (
              <Line
                x1={0}
                y1={toY(goalWeight)}
                x2={cw}
                y2={toY(goalWeight)}
                stroke={colors.accent}
                strokeWidth={1.5}
                strokeDasharray="6,3"
              />
            )}

            <Path
              d={pathD}
              stroke={colors.primary}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {trend && (
              <Line
                x1={toX(minDate).toFixed(1)}
                y1={toY(trendStart).toFixed(1)}
                x2={toX(maxDate).toFixed(1)}
                y2={toY(trendEnd).toFixed(1)}
                stroke={colors.textSecondary}
                strokeWidth={1.5}
                strokeDasharray="5,4"
                opacity={0.55}
              />
            )}

            {chartPoints.map((d, i) => {
              const cx = toX(d.date);
              const cy = toY(d.weight_kg);
              const isActive = activeTip === i;
              const label = `${d.weight_kg.toFixed(1)} kg`;
              // Tooltip width: 12px per char + 16px padding, minimum 64
              const tipW = Math.max(64, label.length * 7 + 20);
              // Clamp tooltip center so it doesn't overflow edges
              const tooltipX = Math.max(tipW / 2, Math.min(cx, cw - tipW / 2));
              const tipH = 24;
              return (
                <G key={`pt-${i}`}>
                  {/* Visible dot */}
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={isActive ? 6 : 4}
                    fill={isActive ? colors.accent : colors.primary}
                  />
                  {/* Transparent larger hit area for easy tapping */}
                  <Circle
                    cx={cx}
                    cy={cy}
                    r={16}
                    fill="transparent"
                    onPress={() => setActiveTip(activeTip === i ? null : i)}
                  />
                  {isActive && (
                    <G>
                      <Rect
                        x={tooltipX - tipW / 2}
                        y={cy - tipH - 8}
                        width={tipW}
                        height={tipH}
                        rx={5}
                        fill={colors.surface}
                        stroke={colors.primary}
                        strokeWidth={1}
                      />
                      <SvgText
                        x={tooltipX}
                        y={cy - tipH - 8 + tipH * 0.7}
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight="700"
                        fill={colors.primary}
                      >
                        {label}
                      </SvgText>
                    </G>
                  )}
                </G>
              );
            })}

            {xLabels.map((d, i) => (
              <SvgText
                key={`xlabel-${i}`}
                x={toX(d.date)}
                y={ch + 20}
                textAnchor={i === 0 ? 'start' : i === xLabels.length - 1 ? 'end' : 'middle'}
                fontSize={9}
                fill={colors.textSecondary}
              >
                {format(new Date(d.date * 1000), 'd MMM', { locale: es })}
              </SvgText>
            ))}
          </G>
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    width: '100%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
});
