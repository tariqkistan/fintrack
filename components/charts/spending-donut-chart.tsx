"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { ChartTooltip, ChartEmpty } from "@/components/charts/chart-primitives";

type CategoryDatum = { name: string; amount: number; color: string };

export function SpendingDonutChart({ data }: { data: CategoryDatum[] }) {
  const total = data.reduce((s, d) => s + d.amount, 0);

  if (data.length === 0) {
    return <ChartEmpty message="No expenses this month — add a transaction to see your breakdown." />;
  }

  return (
    <div className="mt-2 flex flex-col gap-6 lg:flex-row lg:items-center">
      <div className="relative mx-auto h-56 w-full max-w-[240px] shrink-0 sm:h-72 sm:max-w-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {data.map((entry, i) => (
                <linearGradient key={entry.name} id={`pie-${i}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                  <stop offset="100%" stopColor={entry.color} stopOpacity={0.65} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={88}
              paddingAngle={2}
              stroke="rgba(11,11,11,0.8)"
              strokeWidth={2}
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={`url(#pie-${i})`} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => (
                <ChartTooltip
                  active={active}
                  payload={payload}
                  formatter={(v) => formatCurrency(v)}
                />
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Total</p>
          <p className="mt-0.5 text-2xl font-bold text-white">{formatCurrency(total)}</p>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2.5">
        {data.map((entry) => {
          const pct = total > 0 ? ((entry.amount / total) * 100).toFixed(0) : "0";
          return (
            <li key={entry.name}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: entry.color }}
                  />
                  <span className="truncate text-zinc-300">{entry.name}</span>
                </div>
                <span className="shrink-0 font-medium text-white">{formatCurrency(entry.amount)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${entry.color}, ${entry.color}99)`,
                    }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-xs text-zinc-500">{pct}%</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
