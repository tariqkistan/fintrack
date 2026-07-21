"use client";

import { formatCurrency } from "@/lib/utils";

const tooltipStyle = {
  background: "rgba(17, 17, 17, 0.95)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 10,
  padding: "10px 14px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
};

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: unknown;
  label?: string;
  formatter?: (value: number, name: string) => string;
}) {
  if (!active || !payload) return null;

  const items = payload as {
    name?: string;
    value?: number;
    color?: string;
    payload?: { color?: string };
  }[];

  if (!items.length) return null;

  return (
    <div style={tooltipStyle}>
      {label && (
        <p className="mb-1.5 text-xs font-medium text-zinc-400">{label}</p>
      )}
      {items.map((entry, i) => (
        <div key={String(entry.name ?? i)} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{
              background: entry.payload?.color ?? entry.color ?? "#8b5cf6",
            }}
          />
          <span className="text-sm text-zinc-300">{String(entry.name ?? "")}</span>
          <span className="ml-auto pl-4 text-sm font-semibold text-white">
            {formatter
              ? formatter(Number(entry.value ?? 0), String(entry.name ?? ""))
              : formatCurrency(Number(entry.value ?? 0))}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-72 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02]">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10">
        <svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 012-2h2a2 2 0 012 2v6M9 19h6M9 19H7a2 2 0 01-2-2V7a2 2 0 012-2h2m8 12h2a2 2 0 002-2V7a2 2 0 00-2-2h-2m-4-4V3m0 0L9 5m3-3l3 2"
          />
        </svg>
      </div>
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}

export const CHART_GRID = "rgba(255, 255, 255, 0.06)";
export const CHART_AXIS = "#71717a";

export function formatCompactCurrency(value: number) {
  if (value >= 1000) return `R${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `R${value}`;
}
