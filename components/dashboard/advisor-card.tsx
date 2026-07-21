"use client";

import type { FinancialAdvice, FinancialZone } from "@/lib/advisor";
import { BREATHING_RATE, COMFORT_RATE } from "@/lib/advisor";
import type { ProjectedCashflow } from "@/lib/cashflow";
import { formatCurrency, cn } from "@/lib/utils";

const ZONE_META: Record<
  FinancialZone,
  {
    label: string;
    short: string;
    badge: string;
    accent: string;
    bar: string;
    glow: string;
    panel: string;
  }
> = {
  survival: {
    label: "Survival",
    short: "Red zone",
    badge: "bg-red-500/20 text-red-300 ring-red-500/40",
    accent: "text-red-400",
    bar: "from-red-600 to-red-400",
    glow: "shadow-[0_0_40px_-12px_rgba(239,68,68,0.45)]",
    panel: "from-red-500/15 via-transparent to-transparent",
  },
  breathing: {
    label: "Breathing room",
    short: "Thin cushion",
    badge: "bg-amber-500/20 text-amber-200 ring-amber-500/40",
    accent: "text-amber-300",
    bar: "from-amber-600 to-amber-400",
    glow: "shadow-[0_0_40px_-12px_rgba(245,158,11,0.4)]",
    panel: "from-amber-500/15 via-transparent to-transparent",
  },
  comfort: {
    label: "Comfort",
    short: "Healthy buffer",
    badge: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/40",
    accent: "text-emerald-400",
    bar: "from-emerald-600 to-emerald-400",
    glow: "shadow-[0_0_40px_-12px_rgba(16,185,129,0.4)]",
    panel: "from-emerald-500/15 via-transparent to-transparent",
  },
};

const LADDER: { id: FinancialZone; threshold: string }[] = [
  { id: "survival", threshold: "<10%" },
  { id: "breathing", threshold: "10–25%" },
  { id: "comfort", threshold: "25%+" },
];

function pctLabel(rate: number | null) {
  if (rate === null) return "—";
  return `${Math.round(rate * 100)}%`;
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

export function AdvisorCard({
  advice,
  cashflow,
}: {
  advice: FinancialAdvice;
  cashflow: ProjectedCashflow;
}) {
  const meta = ZONE_META[advice.zone];
  const bufferPct = clamp01(advice.progressToComfort) * 100;
  const showBreathing =
    advice.zone === "survival" &&
    advice.earnMoreForBreathing > 0 &&
    advice.bufferRate !== null;
  const showComfort =
    (advice.zone === "survival" || advice.zone === "breathing") &&
    advice.earnMoreForComfort > 0 &&
    advice.bufferRate !== null;
  const showIncomeTargets =
    advice.bufferRate === null && advice.requiredIncomeForBreathing > 0;
  const showCut =
    advice.bufferRate !== null &&
    advice.zone !== "comfort" &&
    (advice.cutForBreathing > 0 || advice.cutForComfort > 0);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]",
        meta.glow
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-90",
          meta.panel
        )}
      />
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/[0.04] blur-3xl" />

      <div className="relative space-y-6 p-5 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
              Financial advisor · v1.5
            </p>
            <h2 className={cn("mt-1 text-2xl font-semibold tracking-tight", meta.accent)}>
              {advice.headline}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
              {advice.summary}
            </p>
          </div>
          <div className="text-right">
            <span
              className={cn(
                "inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                meta.badge
              )}
            >
              {meta.label}
            </span>
            <p className="mt-1.5 text-xs text-zinc-500">{meta.short}</p>
          </div>
        </div>

        {/* Zone ladder */}
        <div className="grid grid-cols-3 gap-2">
          {LADDER.map((step) => {
            const active = advice.zone === step.id;
            const stepMeta = ZONE_META[step.id];
            return (
              <div
                key={step.id}
                className={cn(
                  "rounded-xl border px-3 py-3 transition-colors",
                  active
                    ? "border-white/20 bg-white/[0.07]"
                    : "border-white/5 bg-white/[0.02] opacity-70"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full ring-2 ring-white/10"
                    style={{
                      backgroundColor: active
                        ? step.id === "survival"
                          ? "#f87171"
                          : step.id === "breathing"
                            ? "#fbbf24"
                            : "#34d399"
                        : "#52525b",
                    }}
                  />
                  <p className={cn("text-xs font-medium", active ? stepMeta.accent : "text-zinc-400")}>
                    {stepMeta.label}
                  </p>
                </div>
                <p className="mt-1 font-mono text-[11px] text-zinc-500">Buffer {step.threshold}</p>
              </div>
            );
          })}
        </div>

        {/* Buffer meter */}
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-zinc-500">Buffer toward comfort</p>
              <p className="mt-0.5 text-lg font-semibold text-white">
                {pctLabel(advice.bufferRate)}
                <span className="ml-1 text-sm font-normal text-zinc-500">
                  of income left
                </span>
              </p>
            </div>
            <p className="font-mono text-xs text-zinc-500">
              Goal {Math.round(COMFORT_RATE * 100)}% · Breathing {Math.round(BREATHING_RATE * 100)}%
            </p>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", meta.bar)}
              style={{ width: `${bufferPct}%` }}
            />
            <div
              className="pointer-events-none absolute top-0 h-full w-px bg-amber-300/70"
              style={{ left: `${BREATHING_RATE / COMFORT_RATE * 100}%` }}
              title="Breathing room"
            />
          </div>
          <div className="flex justify-between text-[10px] uppercase tracking-wide text-zinc-600">
            <span>0%</span>
            <span className="text-amber-500/80">10% breathing</span>
            <span className="text-emerald-500/80">25% comfort</span>
          </div>
        </div>

        {/* Metric breakdown */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Income"
            value={formatCurrency(cashflow.income)}
            hint="This month"
          />
          <Metric
            label="Debit commitments"
            value={formatCurrency(cashflow.debitCommitments)}
            hint="Monthly equivalent"
          />
          <Metric
            label="Discretionary"
            value={formatCurrency(cashflow.discretionaryExpenses)}
            hint="Non-debit spend"
          />
          <Metric
            label="Projected leftover"
            value={formatCurrency(cashflow.projectedLeftover)}
            hint={pctLabel(advice.spendRate) === "—" ? "After commitments" : `${pctLabel(advice.spendRate)} spent`}
            valueClass={
              cashflow.projectedLeftover < 0
                ? "text-red-400"
                : cashflow.projectedLeftover > 0
                  ? meta.accent
                  : undefined
            }
          />
        </div>

        {/* Actions */}
        {(showBreathing || showComfort || showIncomeTargets || showCut) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {showIncomeTargets && (
              <>
                <ActionTile
                  title="Income for breathing room"
                  value={formatCurrency(advice.requiredIncomeForBreathing)}
                  detail="Monthly target with current commitments"
                  tone="amber"
                />
                <ActionTile
                  title="Income for comfort"
                  value={formatCurrency(advice.requiredIncomeForComfort)}
                  detail="Monthly target for a 25%+ buffer"
                  tone="emerald"
                />
              </>
            )}
            {showBreathing && (
              <ActionTile
                title="Earn more for breathing room"
                value={formatCurrency(advice.earnMoreForBreathing)}
                detail="Extra income needed per month"
                tone="amber"
              />
            )}
            {showComfort && (
              <ActionTile
                title="Earn more for comfort"
                value={formatCurrency(advice.earnMoreForComfort)}
                detail="Extra income needed per month"
                tone="emerald"
              />
            )}
            {showCut && advice.zone === "survival" && advice.cutForBreathing > 0 && (
              <ActionTile
                title="Or cut spending"
                value={formatCurrency(advice.cutForBreathing)}
                detail="Reduction to reach breathing room"
                tone="amber"
              />
            )}
            {showCut && advice.zone === "breathing" && advice.cutForComfort > 0 && (
              <ActionTile
                title="Or cut spending"
                value={formatCurrency(advice.cutForComfort)}
                detail="Reduction to reach comfort"
                tone="emerald"
              />
            )}
          </div>
        )}

        {/* Tips */}
        {advice.tips.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
              What to do next
            </p>
            <ul className="mt-3 space-y-2.5">
              {advice.tips.map((tip) => (
                <li key={tip} className="flex gap-3 text-sm leading-relaxed text-zinc-300">
                  <span
                    className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", meta.accent)}
                    style={{
                      backgroundColor:
                        advice.zone === "survival"
                          ? "#f87171"
                          : advice.zone === "breathing"
                            ? "#fbbf24"
                            : "#34d399",
                    }}
                  />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  hint,
  valueClass,
}: {
  label: string;
  value: string;
  hint: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-3">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={cn("mt-1 text-base font-semibold text-white", valueClass)}>{value}</p>
      <p className="mt-0.5 text-[11px] text-zinc-600">{hint}</p>
    </div>
  );
}

function ActionTile({
  title,
  value,
  detail,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  tone: "amber" | "emerald";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        tone === "amber"
          ? "border-amber-500/25 bg-amber-500/10"
          : "border-emerald-500/25 bg-emerald-500/10"
      )}
    >
      <p className="text-xs text-zinc-400">{title}</p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold",
          tone === "amber" ? "text-amber-200" : "text-emerald-300"
        )}
      >
        {value}
        <span className="ml-1 text-sm font-normal text-zinc-500">/mo</span>
      </p>
      <p className="mt-1 text-[11px] text-zinc-500">{detail}</p>
    </div>
  );
}
