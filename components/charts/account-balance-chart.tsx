"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
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
import type { Account } from "@/lib/types/database";

const TYPE_COLORS: Record<string, string> = {
  checking: "#8b5cf6",
  savings: "#3b82f6",
  credit_card: "#f97316",
  cash: "#22d3ee",
};

export function AccountBalanceChart({ accounts }: { accounts: Account[] }) {
  const data = accounts.map((a) => ({
    name: a.name.length > 12 ? `${a.name.slice(0, 10)}…` : a.name,
    fullName: a.name,
    balance: a.type === "credit_card" ? -Number(a.balance) : Number(a.balance),
    type: a.type,
    color: TYPE_COLORS[a.type] ?? "#71717a",
  }));

  if (data.length === 0) {
    return <ChartEmpty message="Add accounts to see your balance breakdown." />;
  }

  return (
    <div className="mt-2 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART_GRID} strokeDasharray="4 4" vertical={false} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
          <XAxis
            dataKey="name"
            stroke={CHART_AXIS}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#a1a1aa" }}
          />
          <YAxis
            tickFormatter={formatCompactCurrency}
            stroke={CHART_AXIS}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip
            cursor={{ fill: "rgba(139, 92, 246, 0.06)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const row = payload[0].payload as (typeof data)[0];
              return (
                <ChartTooltip
                  active
                  label={row.fullName}
                  payload={[
                    {
                      name: row.type.replace("_", " "),
                      value: Math.abs(row.balance),
                      color: row.color,
                    },
                  ]}
                  formatter={(v) => formatCurrency(v)}
                />
              );
            }}
          />
          <Bar dataKey="balance" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((entry) => (
              <Cell
                key={entry.fullName}
                fill={entry.balance >= 0 ? entry.color : "#ef4444"}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
