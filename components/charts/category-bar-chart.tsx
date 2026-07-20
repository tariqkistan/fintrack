"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import {
  ChartTooltip,
  ChartEmpty,
  CHART_GRID,
  CHART_AXIS,
  formatCompactCurrency,
} from "@/components/charts/chart-primitives";

type CategoryDatum = { name: string; amount: number; color: string };

export function CategoryBarChart({ data }: { data: CategoryDatum[] }) {
  if (data.length === 0) {
    return <ChartEmpty message="Category breakdown will appear once you log expenses." />;
  }

  const chartData = data.map((d) => ({
    ...d,
    shortName: d.name.length > 14 ? `${d.name.slice(0, 12)}…` : d.name,
  }));

  return (
    <div className="mt-2 h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
        >
          <defs>
            {chartData.map((entry, i) => (
              <linearGradient key={entry.name} id={`bar-${i}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            horizontal={false}
            stroke={CHART_GRID}
            strokeDasharray="4 4"
          />
          <XAxis
            type="number"
            tickFormatter={formatCompactCurrency}
            stroke={CHART_AXIS}
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            width={88}
            stroke={CHART_AXIS}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#a1a1aa" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(139, 92, 246, 0.08)" }}
            content={({ active, payload }) => (
              <ChartTooltip
                active={active}
                payload={payload}
                formatter={(v) => formatCurrency(v)}
              />
            )}
          />
          <Bar dataKey="amount" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {chartData.map((entry, i) => (
              <Cell key={entry.name} fill={`url(#bar-${i})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
