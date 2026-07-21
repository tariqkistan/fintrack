"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import {
  ChartTooltip,
  ChartEmpty,
  CHART_GRID,
  CHART_AXIS,
  formatCompactCurrency,
} from "@/components/charts/chart-primitives";
import type { Transaction } from "@/lib/types/database";

export function SpendingTrendChart({ transactions }: { transactions: Transaction[] }) {
  const { chartData, total } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();

    const daily: {
      day: number;
      label: string;
      amount: number;
      cumulative: number | null;
      future: boolean;
    }[] = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const label = new Date(year, month, day).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      return { day, label, amount: 0, cumulative: 0, future: day > today };
    });

    for (const tx of transactions) {
      if (tx.type !== "expense") continue;
      const d = new Date(tx.occurred_at);
      if (d.getMonth() !== month || d.getFullYear() !== year) continue;
      const idx = d.getDate() - 1;
      if (idx >= 0 && idx < daily.length) {
        daily[idx].amount += Number(tx.amount);
      }
    }

    let running = 0;
    for (const row of daily) {
      if (!row.future) running += row.amount;
      row.cumulative = row.future ? null : running;
    }

    const visible = daily.filter((d) => !d.future);
    const totalSpend = visible.reduce((s, d) => s + d.amount, 0);

    return { chartData: daily, total: totalSpend };
  }, [transactions]);

  const hasData = chartData.some((d) => d.amount > 0);

  if (!hasData) {
    return <ChartEmpty message="Daily spending trend will show here as you add expenses." />;
  }

  return (
    <div className="mt-2">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Month to date
          </p>
          <p className="text-xl font-bold text-white">{formatCurrency(total)}</p>
        </div>
        <p className="text-xs text-zinc-500">Cumulative daily spending</p>
      </div>
      <div className="h-48 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="trendStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="day"
              stroke={CHART_AXIS}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(d) => (d % 5 === 1 || d === 1 ? String(d) : "")}
              interval={0}
            />
            <YAxis
              tickFormatter={formatCompactCurrency}
              stroke={CHART_AXIS}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                const row = chartData.find((d) => d.day === label);
                if (!active || !row) return null;
                return (
                  <ChartTooltip
                    active
                    label={row.label}
                    payload={[
                      { name: "Day spend", value: row.amount, color: "#8b5cf6" },
                      {
                        name: "Running total",
                        value: row.cumulative ?? 0,
                        color: "#3b82f6",
                      },
                    ]}
                    formatter={(v) => formatCurrency(v)}
                  />
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="url(#trendStroke)"
              strokeWidth={2}
              fill="url(#trendFill)"
              dot={false}
              activeDot={{ r: 4, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 1 }}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
