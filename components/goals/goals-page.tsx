"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Account, SavingsGoal } from "@/lib/types/database";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { GoalCard } from "@/components/goals/goal-card";
import { PageHeader } from "@/components/layout/page-header";

import { formPositiveNumber } from "@/lib/validators";

const goalSchema = z.object({
  name: z.string().min(1),
  account_id: z.string().optional(),
  target_amount: formPositiveNumber(),
  target_date: z.string().optional(),
});

export function GoalsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from("accounts").select("*");
      return (data ?? []) as Account[];
    },
  });

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["savings-goals"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("goal_type", "general")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SavingsGoal[];
    },
  });

  const form = useForm({
    resolver: zodResolver(goalSchema),
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
        account_id: values.account_id || null,
        goal_type: "general",
        target_amount: values.target_amount,
        current_amount: 0,
        target_date: values.target_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
      setOpen(false);
      form.reset();
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Savings Goals"
        description="Track progress toward what matters."
        action={<Button onClick={() => setOpen(true)}>New goal</Button>}
      />

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading...</p>
      ) : goals.length === 0 ? (
        <Card>No savings goals yet.</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New savings goal">
        <form onSubmit={form.handleSubmit((v) => createGoal.mutate(v))} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input {...form.register("name")} />
          </div>
          <div>
            <Label>Linked account</Label>
            <Select {...form.register("account_id")}>
              <option value="">None</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Target amount</Label>
            <Input type="number" step="0.01" {...form.register("target_amount")} />
          </div>
          <div>
            <Label>Target date</Label>
            <Input type="date" {...form.register("target_date")} />
          </div>
          <Button type="submit">Create</Button>
        </form>
      </Modal>
    </div>
  );
}
