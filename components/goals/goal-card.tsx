"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { SavingsGoal } from "@/lib/types/database";
import { formatCurrency, formatDate, projectedCompletionDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { formPositiveNumber } from "@/lib/validators";

const contributionSchema = z.object({
  amount: formPositiveNumber(),
  note: z.string().optional(),
});

export function GoalCard({ goal }: { goal: SavingsGoal }) {
  const queryClient = useQueryClient();
  const [contribOpen, setContribOpen] = useState(false);
  const progress = Math.min(100, (goal.current_amount / goal.target_amount) * 100);

  const { data: contributions = [] } = useQuery({
    queryKey: ["goal-contributions", goal.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("goal_contributions")
        .select("*")
        .eq("goal_id", goal.id)
        .order("contributed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const projected = projectedCompletionDate(
    goal.current_amount,
    goal.target_amount,
    contributions.map((c) => ({ amount: c.amount, contributed_at: c.contributed_at }))
  );

  const form = useForm({
    resolver: zodResolver(contributionSchema),
  });

  const addContribution = useMutation({
    mutationFn: async (values: z.infer<typeof contributionSchema>) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: contribError } = await supabase.from("goal_contributions").insert({
        goal_id: goal.id,
        user_id: user.id,
        amount: values.amount,
        note: values.note || null,
      });
      if (contribError) throw contribError;

      const { error: goalError } = await supabase
        .from("savings_goals")
        .update({ current_amount: goal.current_amount + values.amount })
        .eq("id", goal.id);
      if (goalError) throw goalError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      queryClient.invalidateQueries({ queryKey: ["date-night-goal"] });
      queryClient.invalidateQueries({ queryKey: ["goal-contributions", goal.id] });
      setContribOpen(false);
      form.reset();
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase.from("savings_goals").delete().eq("id", goal.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      queryClient.invalidateQueries({ queryKey: ["date-night-goal"] });
      queryClient.invalidateQueries({ queryKey: ["date-night-ideas"] });
      queryClient.invalidateQueries({ queryKey: ["goal-contributions", goal.id] });
    },
  });

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-white">{goal.name}</p>
          <p className="text-sm text-zinc-500">
            {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
          </p>
          {goal.target_date && (
            <p className="text-xs text-zinc-400">Target {formatDate(goal.target_date)}</p>
          )}
          {projected && (
            <p className="text-xs text-violet-300">
              Projected completion {formatDate(projected.toISOString())}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="text-xs" onClick={() => setContribOpen(true)}>
            Add contribution
          </Button>
          <Button
            variant="danger"
            className="text-xs"
            onClick={() => deleteGoal.mutate()}
          >
            Delete
          </Button>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-1 text-right text-xs text-zinc-500">{progress.toFixed(0)}%</p>

      <Modal open={contribOpen} onClose={() => setContribOpen(false)} title="Add contribution">
        <form
          onSubmit={form.handleSubmit((v) => addContribution.mutate(v))}
          className="space-y-4"
        >
          <div>
            <Label>Amount</Label>
            <Input type="number" step="0.01" {...form.register("amount")} />
          </div>
          <div>
            <Label>Note</Label>
            <Input {...form.register("note")} />
          </div>
          <Button type="submit">Save</Button>
        </form>
      </Modal>
    </Card>
  );
}
