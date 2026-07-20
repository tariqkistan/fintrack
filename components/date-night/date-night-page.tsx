"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { DateNightIdea, IdeaStatus, SavingsGoal, Transaction } from "@/lib/types/database";
import { formatCurrency, getMonthRange, formatMonthYear } from "@/lib/utils";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { addMonths, subMonths } from "date-fns";
import { GoalCard } from "@/components/goals/goal-card";
import { PageHeader } from "@/components/layout/page-header";

import { formPositiveNumber, formNonNegativeNumber } from "@/lib/validators";

const goalSchema = z.object({
  name: z.string().min(1),
  target_amount: formPositiveNumber(),
  monthly_budget_cap: formNonNegativeNumber().optional(),
});

const ideaSchema = z.object({
  title: z.string().min(1),
  estimated_cost: formNonNegativeNumber(),
  status: z.enum(["idea", "planned", "done"]),
  planned_date: z.string().optional(),
});

export function DateNightPage() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(new Date());
  const [goalOpen, setGoalOpen] = useState(false);
  const [ideaOpen, setIdeaOpen] = useState(false);

  const range = getMonthRange(month);

  const { data: goal } = useQuery({
    queryKey: ["date-night-goal"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("goal_type", "date_night")
        .maybeSingle();
      if (error) throw error;
      return data as SavingsGoal | null;
    },
  });

  const { data: ideas = [] } = useQuery({
    queryKey: ["date-night-ideas", goal?.id],
    enabled: !!goal,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("date_night_ideas")
        .select("*")
        .eq("goal_id", goal!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DateNightIdea[];
    },
  });

  const { data: spentTransactions = [] } = useQuery({
    queryKey: ["date-night-spent", month.toISOString()],
    queryFn: async () => {
      const supabase = createClient();
      const { data: funCategory } = await supabase
        .from("categories")
        .select("id")
        .eq("name", "Fun / Relationship")
        .maybeSingle();

      if (!funCategory) return [] as Transaction[];

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("category_id", funCategory.id)
        .eq("type", "expense")
        .gte("occurred_at", range.start.toISOString())
        .lte("occurred_at", range.end.toISOString());
      if (error) throw error;
      return data as Transaction[];
    },
  });

  const spent = useMemo(
    () => spentTransactions.reduce((s, t) => s + Number(t.amount), 0),
    [spentTransactions]
  );

  const goalForm = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: { name: "Date Night Fund" },
  });

  const ideaForm = useForm({
    resolver: zodResolver(ideaSchema),
    defaultValues: { status: "idea", estimated_cost: 0 },
  });

  const createGoal = useMutation({
    mutationFn: async (values: z.infer<typeof goalSchema>) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("savings_goals").insert({
        user_id: user.id,
        name: values.name,
        goal_type: "date_night",
        target_amount: values.target_amount,
        current_amount: 0,
        monthly_budget_cap: values.monthly_budget_cap ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["date-night-goal"] });
      setGoalOpen(false);
    },
  });

  const createIdea = useMutation({
    mutationFn: async (values: z.infer<typeof ideaSchema>) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !goal) throw new Error("Missing goal");

      const { error } = await supabase.from("date_night_ideas").insert({
        user_id: user.id,
        goal_id: goal.id,
        title: values.title,
        estimated_cost: values.estimated_cost,
        status: values.status as IdeaStatus,
        planned_date: values.planned_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["date-night-ideas"] });
      setIdeaOpen(false);
      ideaForm.reset({ status: "idea", estimated_cost: 0 });
    },
  });

  const budgetCap = goal?.monthly_budget_cap ?? 0;
  const budgetUsedPct = budgetCap > 0 ? Math.min(100, (spent / budgetCap) * 100) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Date Night Goals"
        description="Fun / relationship savings & planner."
        action={
          !goal ? (
            <Button onClick={() => setGoalOpen(true)}>Create date night goal</Button>
          ) : undefined
        }
      />

      {goal ? (
        <>
          <GoalCard goal={goal} />

          <Card>
            <div className="flex items-center justify-between">
              <CardTitle>Monthly budget · {formatMonthYear(month)}</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setMonth(subMonths(month, 1))}>
                  ←
                </Button>
                <Button variant="ghost" onClick={() => setMonth(addMonths(month, 1))}>
                  →
                </Button>
              </div>
            </div>
            <p className="mt-2 text-lg font-semibold text-white">
              {formatCurrency(spent)}
              {budgetCap > 0 ? ` / ${formatCurrency(budgetCap)}` : " spent"}
            </p>
            {budgetCap > 0 && (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${budgetUsedPct > 100 ? "bg-red-500" : "bg-gradient-to-r from-violet-500 to-pink-500"}`}
                  style={{ width: `${Math.min(100, budgetUsedPct)}%` }}
                />
              </div>
            )}
          </Card>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Planner ideas</h2>
            <Button onClick={() => setIdeaOpen(true)}>Add idea</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {ideas.map((idea) => (
              <Card key={idea.id}>
                <p className="font-medium text-white">{idea.title}</p>
                <p className="text-sm text-zinc-500">
                  {idea.status} · Est. {formatCurrency(idea.estimated_cost)}
                </p>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>Create a date night goal to start planning and tracking.</Card>
      )}

      <Modal open={goalOpen} onClose={() => setGoalOpen(false)} title="Date night goal">
        <form onSubmit={goalForm.handleSubmit((v) => createGoal.mutate(v))} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input {...goalForm.register("name")} />
          </div>
          <div>
            <Label>Savings target</Label>
            <Input type="number" step="0.01" {...goalForm.register("target_amount")} />
          </div>
          <div>
            <Label>Monthly budget cap (optional)</Label>
            <Input type="number" step="0.01" {...goalForm.register("monthly_budget_cap")} />
          </div>
          <Button type="submit">Create</Button>
        </form>
      </Modal>

      <Modal open={ideaOpen} onClose={() => setIdeaOpen(false)} title="Add date night idea">
        <form onSubmit={ideaForm.handleSubmit((v) => createIdea.mutate(v))} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input {...ideaForm.register("title")} placeholder="Restaurant, activity..." />
          </div>
          <div>
            <Label>Estimated cost</Label>
            <Input type="number" step="0.01" {...ideaForm.register("estimated_cost")} />
          </div>
          <div>
            <Label>Status</Label>
            <Select {...ideaForm.register("status")}>
              <option value="idea">Idea</option>
              <option value="planned">Planned</option>
              <option value="done">Done</option>
            </Select>
          </div>
          <div>
            <Label>Planned date</Label>
            <Input type="date" {...ideaForm.register("planned_date")} />
          </div>
          <Button type="submit">Save</Button>
        </form>
      </Modal>
    </div>
  );
}
