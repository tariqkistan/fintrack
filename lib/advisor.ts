import type { ProjectedCashflow } from "@/lib/cashflow";

export const BREATHING_RATE = 0.1;
export const COMFORT_RATE = 0.25;

export type FinancialZone = "survival" | "breathing" | "comfort";

export type FinancialAdvice = {
  zone: FinancialZone;
  nextZone: FinancialZone | null;
  bufferRate: number | null;
  spendRate: number | null;
  commitmentsTotal: number;
  /** 0–1+ progress of buffer toward comfort (25%). Clamped display at 1 in UI. */
  progressToComfort: number;
  /** 0–1+ progress of buffer toward breathing room (10%). */
  progressToBreathing: number;
  headline: string;
  summary: string;
  tips: string[];
  earnMoreForBreathing: number;
  earnMoreForComfort: number;
  requiredIncomeForBreathing: number;
  requiredIncomeForComfort: number;
  cutForBreathing: number;
  cutForComfort: number;
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

function nextZoneFor(zone: FinancialZone): FinancialZone | null {
  if (zone === "survival") return "breathing";
  if (zone === "breathing") return "comfort";
  return null;
}

function buildTips(
  zone: FinancialZone,
  cashflow: ProjectedCashflow,
  earnBreathing: number,
  earnComfort: number,
  cutBreathing: number,
  cutComfort: number
): string[] {
  const tips: string[] = [];
  const { income, debitCommitments, discretionaryExpenses, projectedLeftover } = cashflow;

  if (income <= 0) {
    tips.push("Log this month’s salary (or other income) under Transactions so advice can score your buffer.");
    if (debitCommitments > 0) {
      tips.push("Review active debit orders — they still count as monthly commitments even before income is logged.");
    }
    return tips;
  }

  if (zone === "survival") {
    if (projectedLeftover < 0) {
      tips.push(
        `You’re short about ${Math.round(Math.abs(projectedLeftover))} this month — raise income or cut spend to break even.`
      );
    }
    if (earnBreathing > 0) {
      tips.push(`Side income or a raise of about ${Math.round(earnBreathing)}/month would unlock breathing room.`);
    }
    if (cutBreathing > 0 && discretionaryExpenses > 0) {
      tips.push(`Cutting about ${Math.round(cutBreathing)} in discretionary spend would also reach breathing room.`);
    }
    if (debitCommitments > income * 0.5) {
      tips.push("Debit orders take a large share of income — pause anything non-essential if you can.");
    }
    tips.push("Prioritise essentials first; delay nice-to-haves until leftover turns positive.");
  } else if (zone === "breathing") {
    if (earnComfort > 0) {
      tips.push(`About ${Math.round(earnComfort)} more income per month would put you in comfort (25%+ leftover).`);
    }
    if (cutComfort > 0 && discretionaryExpenses > 0) {
      tips.push(`Or trim roughly ${Math.round(cutComfort)} in discretionary spend to hit comfort without earning more.`);
    }
    tips.push("Park leftover into a savings goal so the cushion doesn’t silently disappear.");
    tips.push("Keep debit orders reviewed monthly — small increases compound into survival mode.");
  } else {
    tips.push("You’re in a strong position — automate a transfer of surplus into savings or investments.");
    tips.push("Protect comfort by avoiding lifestyle creep when income rises.");
    if (discretionaryExpenses > debitCommitments && debitCommitments > 0) {
      tips.push("Discretionary spend exceeds debit commitments — that’s fine if intentional; keep an eye on it.");
    }
  }

  return tips.slice(0, 4);
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
  const commitmentsTotal = debitCommitments + discretionaryExpenses;
  const bufferRate = income > 0 ? projectedLeftover / income : null;
  const spendRate = income > 0 ? commitmentsTotal / income : null;

  const requiredIncomeForBreathing = requiredIncomeForRate(commitmentsTotal, BREATHING_RATE);
  const requiredIncomeForComfort = requiredIncomeForRate(commitmentsTotal, COMFORT_RATE);
  const earnMoreForBreathing = Math.max(0, requiredIncomeForBreathing - Math.max(0, income));
  const earnMoreForComfort = Math.max(0, requiredIncomeForComfort - Math.max(0, income));

  // Cut needed so leftover/income hits target rate: leftover = income - C' => C' = income*(1-t)
  const maxCommitmentsBreathing = income > 0 ? income * (1 - BREATHING_RATE) : 0;
  const maxCommitmentsComfort = income > 0 ? income * (1 - COMFORT_RATE) : 0;
  const cutForBreathing = Math.max(0, commitmentsTotal - maxCommitmentsBreathing);
  const cutForComfort = Math.max(0, commitmentsTotal - maxCommitmentsComfort);

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

  const progressToBreathing =
    bufferRate === null ? 0 : Math.max(0, bufferRate / BREATHING_RATE);
  const progressToComfort = bufferRate === null ? 0 : Math.max(0, bufferRate / COMFORT_RATE);

  return {
    zone,
    nextZone: nextZoneFor(zone),
    bufferRate,
    spendRate,
    commitmentsTotal,
    progressToComfort,
    progressToBreathing,
    headline,
    summary,
    tips: buildTips(
      zone,
      cashflow,
      earnMoreForBreathing,
      earnMoreForComfort,
      cutForBreathing,
      cutForComfort
    ),
    earnMoreForBreathing,
    earnMoreForComfort,
    requiredIncomeForBreathing,
    requiredIncomeForComfort,
    cutForBreathing,
    cutForComfort,
  };
}
