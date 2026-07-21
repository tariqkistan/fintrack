import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";
import { computeProjectedCashflow } from "../cashflow";
import { advanceDueDate } from "../utils";

export function createMcpSupabaseClient(userId?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const client = createClient<Database>(url, key);

  return { client, userId };
}

export async function getTransactions(
  client: ReturnType<typeof createClient<Database>>,
  userId: string,
  options?: { limit?: number; from?: string; to?: string }
) {
  let query = client
    .from("transactions")
    .select("*, category:categories(name, color), account:accounts(name)")
    .eq("user_id", userId)
    .order("occurred_at", { ascending: false });

  if (options?.from) query = query.gte("occurred_at", options.from);
  if (options?.to) query = query.lte("occurred_at", options.to);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getGoalProgress(
  client: ReturnType<typeof createClient<Database>>,
  userId: string
) {
  const { data, error } = await client
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;

  return (data ?? []).map((goal) => ({
    id: goal.id,
    name: goal.name,
    goal_type: goal.goal_type,
    target_amount: goal.target_amount,
    current_amount: goal.current_amount,
    progress_pct: Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100),
    target_date: goal.target_date,
  }));
}

export async function getUpcomingDebitOrders(
  client: ReturnType<typeof createClient<Database>>,
  userId: string,
  days = 30
) {
  const today = new Date().toISOString().split("T")[0];
  const end = new Date();
  end.setDate(end.getDate() + days);
  const endStr = end.toISOString().split("T")[0];

  const { data, error } = await client
    .from("debit_orders")
    .select("*, account:accounts(name), category:categories(name)")
    .eq("user_id", userId)
    .eq("active", true)
    .gte("next_due_date", today)
    .lte("next_due_date", endStr)
    .order("next_due_date");

  if (error) throw error;
  return data;
}

export async function getAccountSummary(
  client: ReturnType<typeof createClient<Database>>,
  userId: string
) {
  const { data, error } = await client.from("accounts").select("*").eq("user_id", userId);
  if (error) throw error;

  const netWorth = (data ?? []).reduce((sum, a) => {
    const balance = Number(a.balance);
    return a.type === "credit_card" ? sum - balance : sum + balance;
  }, 0);

  return { accounts: data, net_worth: netWorth };
}

export async function getProjectedCashflow(
  client: ReturnType<typeof createClient<Database>>,
  userId: string
) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const [txResult, debitResult] = await Promise.all([
    client
      .from("transactions")
      .select("amount, type, debit_order_id")
      .eq("user_id", userId)
      .gte("occurred_at", start.toISOString()),
    client
      .from("debit_orders")
      .select("amount, frequency, custom_interval_days, active")
      .eq("user_id", userId)
      .eq("active", true),
  ]);

  if (txResult.error) throw txResult.error;
  if (debitResult.error) throw debitResult.error;

  const cashflow = computeProjectedCashflow({
    transactions: txResult.data ?? [],
    debitOrders: debitResult.data ?? [],
  });

  return {
    month_start: start.toISOString(),
    income: cashflow.income,
    debit_commitments: cashflow.debitCommitments,
    discretionary_expenses: cashflow.discretionaryExpenses,
    projected_leftover: cashflow.projectedLeftover,
  };
}

export { advanceDueDate };
