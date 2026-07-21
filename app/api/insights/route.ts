import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeProjectedCashflow } from "@/lib/cashflow";
import { evaluateFinancialHealth } from "@/lib/advisor";

async function buildInsightsPayload() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const [txResult, debitResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, type, debit_order_id")
      .eq("user_id", user.id)
      .gte("occurred_at", start.toISOString()),
    supabase
      .from("debit_orders")
      .select("amount, frequency, custom_interval_days, active")
      .eq("user_id", user.id)
      .eq("active", true),
  ]);

  if (txResult.error) throw txResult.error;
  if (debitResult.error) throw debitResult.error;

  const cashflow = computeProjectedCashflow({
    transactions: txResult.data ?? [],
    debitOrders: debitResult.data ?? [],
  });
  const advice = evaluateFinancialHealth(cashflow);

  return {
    data: {
      version: "1.4.0",
      cashflow: {
        income: cashflow.income,
        debit_commitments: cashflow.debitCommitments,
        discretionary_expenses: cashflow.discretionaryExpenses,
        projected_leftover: cashflow.projectedLeftover,
      },
      advice,
    },
  };
}

export async function GET() {
  try {
    const result = await buildInsightsPayload();
    if ("error" in result && result.error) return result.error;
    return NextResponse.json(result.data);
  } catch (error) {
    console.error("GET /api/insights", error);
    return NextResponse.json({ error: "Failed to compute insights" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await buildInsightsPayload();
    if ("error" in result && result.error) return result.error;
    return NextResponse.json(result.data);
  } catch (error) {
    console.error("POST /api/insights", error);
    return NextResponse.json({ error: "Failed to compute insights" }, { status: 500 });
  }
}
