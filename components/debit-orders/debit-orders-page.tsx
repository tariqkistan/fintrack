"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Account, Category, DebitOrder, DebitFrequency } from "@/lib/types/database";
import { formatCurrency, formatDate, addDays } from "@/lib/utils";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/layout/page-header";

import { formPositiveNumber, formNumber } from "@/lib/validators";

const schema = z.object({
  name: z.string().min(1),
  account_id: z.string().min(1),
  category_id: z.string().optional(),
  amount: formPositiveNumber(),
  frequency: z.enum(["weekly", "monthly", "custom"]),
  custom_interval_days: formNumber().optional(),
  next_due_date: z.string().min(1),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function UpcomingWidget({ days }: { days: number }) {
  const cutoff = addDays(new Date(), days).toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  const { data: upcoming = [] } = useQuery({
    queryKey: ["debit-orders-upcoming", days],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("debit_orders")
        .select("*, account:accounts(*), category:categories(*)")
        .eq("active", true)
        .gte("next_due_date", today)
        .lte("next_due_date", cutoff)
        .order("next_due_date");
      if (error) throw error;
      return data as DebitOrder[];
    },
  });

  return (
    <Card>
      <CardTitle>Next {days} days</CardTitle>
      {upcoming.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">No upcoming payments</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {upcoming.map((d) => (
            <li key={d.id} className="flex justify-between text-sm">
              <span>
                {d.name} · {formatDate(d.next_due_date)}
              </span>
              <span className="font-medium">{formatCurrency(d.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function DebitOrdersPage() {
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

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from("categories").select("*").eq("type", "expense");
      return (data ?? []) as Category[];
    },
  });

  const { data: debitOrders = [], isLoading } = useQuery({
    queryKey: ["debit-orders"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("debit_orders")
        .select("*, account:accounts(*), category:categories(*)")
        .order("next_due_date");
      if (error) throw error;
      return data as DebitOrder[];
    },
  });

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      frequency: "monthly",
      next_due_date: new Date().toISOString().split("T")[0],
      active: true,
    },
  });

  const frequency = form.watch("frequency");

  const save = useMutation({
    mutationFn: async (values: FormValues) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("debit_orders").insert({
        user_id: user.id,
        name: values.name,
        account_id: values.account_id,
        category_id: values.category_id || null,
        amount: values.amount,
        frequency: values.frequency as DebitFrequency,
        custom_interval_days:
          values.frequency === "custom" ? values.custom_interval_days ?? null : null,
        next_due_date: values.next_due_date,
        active: values.active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debit-orders"] });
      queryClient.invalidateQueries({ queryKey: ["debit-orders-upcoming"] });
      setOpen(false);
      form.reset();
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const supabase = createClient();
      const { error } = await supabase.from("debit_orders").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debit-orders"] });
      queryClient.invalidateQueries({ queryKey: ["debit-orders-upcoming"] });
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Debit Orders"
        description="Recurring rent, subscriptions, and loans."
        action={<Button onClick={() => setOpen(true)}>Add debit order</Button>}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <UpcomingWidget days={7} />
        <UpcomingWidget days={30} />
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading...</p>
      ) : (
        <div className="space-y-2">
          {debitOrders.map((d) => (
            <Card key={d.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{d.name}</p>
                <p className="text-xs text-zinc-500">
                  {d.frequency} · Next {formatDate(d.next_due_date)} · {d.account?.name}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{formatCurrency(d.amount)}</span>
                <Button
                  variant="secondary"
                  className="text-xs"
                  onClick={() => toggleActive.mutate({ id: d.id, active: !d.active })}
                >
                  {d.active ? "Pause" : "Resume"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add debit order">
        <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input {...form.register("name")} />
          </div>
          <div>
            <Label>Account</Label>
            <Select {...form.register("account_id")}>
              <option value="">Select</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Select {...form.register("category_id")}>
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Amount</Label>
            <Input type="number" step="0.01" {...form.register("amount")} />
          </div>
          <div>
            <Label>Frequency</Label>
            <Select {...form.register("frequency")}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </Select>
          </div>
          {frequency === "custom" && (
            <div>
              <Label>Interval (days)</Label>
              <Input type="number" {...form.register("custom_interval_days")} />
            </div>
          )}
          <div>
            <Label>Next due date</Label>
            <Input type="date" {...form.register("next_due_date")} />
          </div>
          <Button type="submit">Save</Button>
        </form>
      </Modal>
    </div>
  );
}
