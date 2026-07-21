import type { DebitFrequency } from "@/lib/types/database";

export type CashflowTransaction = {
  amount: number;
  type: "income" | "expense";
  debit_order_id?: string | null;
};

export type CashflowDebitOrder = {
  amount: number;
  frequency: DebitFrequency;
  custom_interval_days?: number | null;
  active?: boolean;
};

export type ProjectedCashflow = {
  income: number;
  debitCommitments: number;
  discretionaryExpenses: number;
  projectedLeftover: number;
};

/** Normalize a debit order amount to a monthly equivalent. */
export function toMonthlyDebitAmount(order: CashflowDebitOrder): number {
  const amount = Number(order.amount);
  if (!Number.isFinite(amount) || amount <= 0) return 0;

  switch (order.frequency) {
    case "weekly":
      return amount * (52 / 12);
    case "custom": {
      const days = order.custom_interval_days;
      if (!days || days <= 0) return amount;
      return amount * (30 / days);
    }
    case "monthly":
    default:
      return amount;
  }
}

/**
 * Projected leftover for the current month:
 * income − active debit commitments (monthly-normalized) − discretionary expenses
 * (expenses not linked to a debit order, to avoid double-counting).
 */
export function computeProjectedCashflow({
  transactions,
  debitOrders,
}: {
  transactions: CashflowTransaction[];
  debitOrders: CashflowDebitOrder[];
}): ProjectedCashflow {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const debitCommitments = debitOrders
    .filter((o) => o.active !== false)
    .reduce((sum, o) => sum + toMonthlyDebitAmount(o), 0);

  const discretionaryExpenses = transactions
    .filter((t) => t.type === "expense" && !t.debit_order_id)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    income,
    debitCommitments,
    discretionaryExpenses,
    projectedLeftover: income - debitCommitments - discretionaryExpenses,
  };
}
