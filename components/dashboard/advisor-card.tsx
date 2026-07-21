import type { FinancialAdvice } from "@/lib/advisor";
import { formatCurrency, cn } from "@/lib/utils";
import { Card, CardTitle } from "@/components/ui/card";

const ZONE_LABEL: Record<FinancialAdvice["zone"], string> = {
  survival: "Survival",
  breathing: "Breathing room",
  comfort: "Comfort",
};

const ZONE_BADGE: Record<FinancialAdvice["zone"], string> = {
  survival: "bg-red-500/15 text-red-400 ring-red-500/30",
  breathing: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  comfort: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
};

const ZONE_HEADLINE: Record<FinancialAdvice["zone"], string> = {
  survival: "text-red-400",
  breathing: "text-amber-300",
  comfort: "text-emerald-400",
};

export function AdvisorCard({ advice }: { advice: FinancialAdvice }) {
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

  return (
    <Card glow className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <CardTitle className="!text-zinc-400">Financial advisor</CardTitle>
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
            ZONE_BADGE[advice.zone]
          )}
        >
          {ZONE_LABEL[advice.zone]}
        </span>
      </div>

      <div>
        <h3 className={cn("text-lg font-semibold tracking-tight sm:text-xl", ZONE_HEADLINE[advice.zone])}>
          {advice.headline}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{advice.summary}</p>
      </div>

      {(showBreathing || showComfort || showIncomeTargets) && (
        <ul className="space-y-2 border-t border-white/5 pt-4 text-sm text-zinc-300">
          {showIncomeTargets && (
            <>
              <li>
                Target income for breathing room:{" "}
                <span className="font-medium text-white">
                  {formatCurrency(advice.requiredIncomeForBreathing)}
                </span>
                /month
              </li>
              <li>
                Target income for comfort:{" "}
                <span className="font-medium text-white">
                  {formatCurrency(advice.requiredIncomeForComfort)}
                </span>
                /month
              </li>
            </>
          )}
          {showBreathing && (
            <li>
              Earn{" "}
              <span className="font-medium text-white">
                {formatCurrency(advice.earnMoreForBreathing)}
              </span>{" "}
              more per month for breathing room
            </li>
          )}
          {showComfort && (
            <li>
              Earn{" "}
              <span className="font-medium text-white">
                {formatCurrency(advice.earnMoreForComfort)}
              </span>{" "}
              more per month for comfort
            </li>
          )}
        </ul>
      )}
    </Card>
  );
}
