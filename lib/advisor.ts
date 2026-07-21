import type { ProjectedCashflow } from "@/lib/cashflow";

export const BREATHING_RATE = 0.1;
export const COMFORT_RATE = 0.25;

export type FinancialZone = "survival" | "breathing" | "comfort";

export type FinancialAdvice = {
  zone: FinancialZone;
  bufferRate: number | null;
  headline: string;
  summary: string;
  earnMoreForBreathing: number;
  earnMoreForComfort: number;
  requiredIncomeForBreathing: number;
  requiredIncomeForComfort: number;
};

function requiredIncomeForRate(commitments: number, rate: number): number {
  const denominator = 1 - rate;
  if (denominator <= 0) return commitments;
  if (commitments <= 0) return 0;
  return commitments / denominator;
}

function classifyZone(income: number, leftover: number, bufferRate: number | null): FinancialZone {
  if (income <= 0 || leftover <= 0 || bufferRate === null || bufferRate < BREATHING_RATE) {
    return "survival";
  }
  if (bufferRate < COMFORT_RATE) {
    return "breathing";
  }
  return "comfort";
}

function buildCopy(
  zone: FinancialZone,
  cashflow: ProjectedCashflow,
  bufferRate: number | null,
  requiredBreathing: number,
  requiredComfort: number,
  earnBreathing: number,
  earnComfort: number
): { headline: string; summary: string } {
  const { income, debitCommitments, discretionaryExpenses, projectedLeftover } = cashflow;
  const commitments = debitCommitments + discretionaryExpenses;

  if (income <= 0) {
    if (commitments <= 0) {
      return {
        headline: "Add this month’s income to get advice",
        summary:
          "Log your salary or other income, then Fintrack can place you in Survival, Breathing room, or Comfort.",
      };
    }
    return {
      headline: "Add this month’s income to get advice",
      summary: `With about ${Math.round(commitments)} in monthly commitments, you’d need roughly ${Math.round(requiredBreathing)}/month income for breathing room, or ${Math.round(requiredComfort)}/month for comfort.`,
    };
  }

  if (zone === "survival") {
    if (projectedLeftover <= 0) {
      return {
        headline: "You’re in the red — survival mode",
        summary:
          earnBreathing > 0
            ? `Income doesn’t cover debits and spending. Earn about ${Math.round(earnBreathing)} more per month for breathing room, or ${Math.round(earnComfort)} more for comfort — or cut commitments.`
            : "Income doesn’t cover debits and spending. Cut discretionary spending or pause non-essential debit orders to get out of the red.",
      };
    }
    return {
      headline: "Survival mode — thin or no buffer",
      summary:
        earnBreathing > 0
          ? `Your leftover is under 10% of income. Earn about ${Math.round(earnBreathing)} more per month for breathing room, or ${Math.round(earnComfort)} more for comfort.`
          : "Your leftover is under 10% of income. Trim spending or boost income to build a safer cushion.",
    };
  }

  if (zone === "breathing") {
    const pct = Math.round((bufferRate ?? 0) * 100);
    return {
      headline: "Breathing room — you’re getting by",
      summary:
        earnComfort > 0
          ? `About ${pct}% of income is left after commitments. Earn roughly ${Math.round(earnComfort)} more per month (or spend less) to reach comfort (25%+ leftover).`
          : `About ${pct}% of income is left after commitments. Keep tracking to protect this cushion.`,
    };
  }

  const pct = Math.round((bufferRate ?? 0) * 100);
  return {
    headline: "Comfort zone — healthy leftover",
    summary: `About ${pct}% of income remains after debits and spending. You’re in a strong position to save or invest the surplus.`,
  };
}

/**
 * Rule-based financial health from projected monthly cashflow.
 */
export function evaluateFinancialHealth(cashflow: ProjectedCashflow): FinancialAdvice {
  const { income, debitCommitments, discretionaryExpenses, projectedLeftover } = cashflow;
  const commitments = debitCommitments + discretionaryExpenses;
  const bufferRate = income > 0 ? projectedLeftover / income : null;

  const requiredIncomeForBreathing = requiredIncomeForRate(commitments, BREATHING_RATE);
  const requiredIncomeForComfort = requiredIncomeForRate(commitments, COMFORT_RATE);
  const earnMoreForBreathing = Math.max(0, requiredIncomeForBreathing - Math.max(0, income));
  const earnMoreForComfort = Math.max(0, requiredIncomeForComfort - Math.max(0, income));

  const zone = classifyZone(income, projectedLeftover, bufferRate);
  const { headline, summary } = buildCopy(
    zone,
    cashflow,
    bufferRate,
    requiredIncomeForBreathing,
    requiredIncomeForComfort,
    earnMoreForBreathing,
    earnMoreForComfort
  );

  return {
    zone,
    bufferRate,
    headline,
    summary,
    earnMoreForBreathing,
    earnMoreForComfort,
    requiredIncomeForBreathing,
    requiredIncomeForComfort,
  };
}
