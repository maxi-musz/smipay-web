"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AXIS_COLOR,
  GRID_COLOR,
  PALETTE,
  fmtDateShort,
  fmtInt,
} from "./format";

interface SeriesDef {
  key: string;
  label: string;
  color?: string;
}

const tooltipStyle = {
  contentStyle: {
    borderRadius: 10,
    border: `1px solid ${GRID_COLOR}`,
    fontSize: 12,
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  },
  labelStyle: { color: "#334155", fontWeight: 600 },
};

/** Multi-series area/line trend over a date axis. */
export function TrendChart({
  data,
  series,
  height = 260,
  yTickFormatter,
  valueFormatter,
}: {
  data: Record<string, unknown>[];
  series: SeriesDef[];
  height?: number;
  yTickFormatter?: (v: number) => string;
  valueFormatter?: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          {series.map((s, i) => {
            const c = s.color ?? PALETTE[i % PALETTE.length];
            return (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c} stopOpacity={0.28} />
                <stop offset="100%" stopColor={c} stopOpacity={0.02} />
              </linearGradient>
            );
          })}
        </defs>
        <XAxis
          dataKey="date"
          tickFormatter={(v) => fmtDateShort(v as string)}
          tick={{ fontSize: 11, fill: AXIS_COLOR }}
          axisLine={{ stroke: GRID_COLOR }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 11, fill: AXIS_COLOR }}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={yTickFormatter ? (v) => yTickFormatter(v as number) : undefined}
        />
        <Tooltip
          {...tooltipStyle}
          formatter={(value, name) => [
            valueFormatter ? valueFormatter(Number(value)) : fmtInt(Number(value)),
            String(name),
          ]}
          labelFormatter={(v) => fmtDateShort(v as string)}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {series.map((s, i) => {
          const c = s.color ?? PALETTE[i % PALETTE.length];
          return (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={c}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              dot={false}
              activeDot={{ r: 4 }}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface CatDatum {
  label: string;
  value: number;
}

/** Horizontal bars for a categorical breakdown. */
export function CategoryBars({
  data,
  height = 260,
  color = PALETTE[0],
  valueFormatter = fmtInt,
}: {
  data: CatDatum[];
  height?: number;
  color?: string;
  valueFormatter?: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={120}
          tick={{ fontSize: 12, fill: "#475569" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          {...tooltipStyle}
          cursor={{ fill: "rgba(148,163,184,0.08)" }}
          formatter={(value) => [valueFormatter(Number(value)), "Value"]}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={26}>
          {data.map((_, i) => (
            <Cell key={i} fill={color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Donut for a categorical share. */
export function CategoryDonut({
  data,
  height = 260,
  valueFormatter = fmtInt,
}: {
  data: CatDatum[];
  height?: number;
  valueFormatter?: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius="55%"
          outerRadius="82%"
          paddingAngle={2}
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          {...tooltipStyle}
          formatter={(value, name) => [valueFormatter(Number(value)), String(name)]}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          iconType="circle"
          iconSize={9}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
