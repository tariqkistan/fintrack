"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Account, DebitOrder, SavingsGoal, Transaction } from "@/lib/types/database";
import { computeProjectedCashflow } from "@/lib/cashflow";
import { evaluateFinancialHealth } from "@/lib/advisor";
import { formatCurrency, formatDate, addDays } from "@/lib/utils";
import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { GoalCard } from "@/components/goals/goal-card";
import { AdvisorCard } from "@/components/dashboard/advisor-card";
import { SpendingDonutChart } from "@/components/charts/spending-donut-chart";
import { CategoryBarChart } from "@/components/charts/category-bar-chart";
import { SpendingTrendChart } from "@/components/charts/spending-trend-chart";
import { AccountBalanceChart } from "@/components/charts/account-balance-chart";

export function DashboardPage() {
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("accounts").select("*");
      if (error) throw error;
      return data as Account[];
    },
  });

  const { data: monthTransactions = [] } = useQuery({
    queryKey: ["transactions-month"],
    queryFn: async () => {
      const supabase = createClient();
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("transactions")
        .select("*, category:categories(*)")
        .gte("occurred_at", start.toISOString());
      if (error) throw error;
      return data as Transaction[];
    },
  });

  const expenses = useMemo(
    () => monthTransactions.filter((t) => t.type === "expense"),
    [monthTransactions]
  );

  const { data: goals = [] } = useQuery({
    queryKey: ["savings-goals"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("savings_goals").select("*");
      if (error) throw error;
      return data as SavingsGoal[];
    },
  });

  const cutoff7 = addDays(new Date(), 7).toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  const { data: activeDebits = [] } = useQuery({
    queryKey: ["debit-orders-active"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("debit_orders")
        .select("*")
        .eq("active", true)
        .order("next_due_date");
      if (error) throw error;
      return data as DebitOrder[];
    },
  });

  const { data: upcoming = [] } = useQuery({
    queryKey: ["debit-orders-upcoming", 7],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("debit_orders")
        .select("*")
        .eq("active", true)
        .gte("next_due_date", today)
        .lte("next_due_date", cutoff7)
        .order("next_due_date");
      if (error) throw error;
      return data as DebitOrder[];
    },
  });

  const netWorth = accounts.reduce((sum, a) => {
    const balance = Number(a.balance);
    return a.type === "credit_card" ? sum - balance : sum + balance;
  }, 0);

  const cashflow = useMemo(
    () =>
      computeProjectedCashflow({
        transactions: monthTransactions,
        debitOrders: activeDebits,
      }),
    [monthTransactions, activeDebits]
  );

  const advice = useMemo(() => evaluateFinancialHealth(cashflow), [cashflow]);

  const spendingByCategory = useMemo(() => {
    const map = new Map<string, { name: string; amount: number; color: string }>();
    for (const tx of expenses) {
      const name = tx.category?.name ?? "Other";
      const color = tx.category?.color ?? "#64748b";
      const existing = map.get(name) ?? { name, amount: 0, color };
      existing.amount += Number(tx.amount);
      map.set(name, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Projected leftover after income, debit orders, and discretionary spending."
      />

      <AdvisorCard advice={advice} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card glow>
          <CardTitle>Projected leftover</CardTitle>
          <CardValue
            className={
              cashflow.projectedLeftover < 0 ? "text-red-400" : undefined
            }
          >
            {formatCurrency(cashflow.projectedLeftover)}
          </CardValue>
          <p className="mt-1 text-xs text-zinc-500">
            Income − debits − discretionary
          </p>
        </Card>
        <Card>
          <CardTitle>Monthly income</CardTitle>
          <CardValue>{formatCurrency(cashflow.income)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Debit commitments</CardTitle>
          <CardValue>{formatCurrency(cashflow.debitCommitments)}</CardValue>
          <p className="mt-1 text-xs text-zinc-500">Monthly equivalent</p>
        </Card>
        <Card>
          <CardTitle>Discretionary spending</CardTitle>
          <CardValue>{formatCurrency(cashflow.discretionaryExpenses)}</CardValue>
          <p className="mt-1 text-xs text-zinc-500">Excludes posted debit orders</p>
        </Card>
        <Card>
          <CardTitle>Net worth</CardTitle>
          <CardValue>{formatCurrency(netWorth)}</CardValue>
        </Card>
        <Card>
          <CardTitle>Accounts</CardTitle>
          <CardValue>{accounts.length}</CardValue>
        </Card>
      </div>

      <Card>
        <CardTitle>Spending trend</CardTitle>
        <SpendingTrendChart transactions={monthTransactions} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Spending by category</CardTitle>
          <SpendingDonutChart data={spendingByCategory} />
        </Card>

        <Card>
          <CardTitle>Category breakdown</CardTitle>
          <CategoryBarChart data={spendingByCategory} />
        </Card>
      </div>

      <Card>
        <CardTitle>Account balances</CardTitle>
        <AccountBalanceChart accounts={accounts} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Upcoming debit orders (7 days)</CardTitle>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">Nothing due soon</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {upcoming.map((d) => (
                <li key={d.id} className="flex justify-between text-sm text-zinc-300">
                  <span>
                    {d.name} · {formatDate(d.next_due_date)}
                  </span>
                  <span className="font-medium text-white">{formatCurrency(d.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Savings goals</h2>
          {goals.length === 0 ? (
            <Card className="text-zinc-400">No goals yet</Card>
          ) : (
            goals.slice(0, 3).map((g) => <GoalCard key={g.id} goal={g} />)
          )}
        </div>
      </div>

      <div className="void-cta-gradient rounded-2xl px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-white md:text-3xl">Track at warp speed</h2>
        <p className="mt-2 text-zinc-400">Accounts. Transactions. Goals. Deploy your finances.</p>
      </div>
    </div>
  );
}
