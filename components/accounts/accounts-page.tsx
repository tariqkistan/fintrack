"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Account, AccountType } from "@/lib/types/database";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select } from "@/components/ui/input";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { formNumber, formPositiveNumber } from "@/lib/validators";

const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["checking", "savings", "credit_card", "cash"]),
  balance: formNumber(),
  currency: z.string().min(3).max(3),
});

type AccountForm = z.infer<typeof accountSchema>;

function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Account[];
    },
  });
}

export function AccountsPage() {
  const queryClient = useQueryClient();
  const { data: accounts = [], isLoading } = useAccounts();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const form = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: "", type: "checking" as const, balance: 0, currency: "ZAR" },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: AccountForm) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (editing) {
        const { error } = await supabase
          .from("accounts")
          .update({ name: values.name, type: values.type, currency: values.currency })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("accounts").insert({
          user_id: user.id,
          name: values.name,
          type: values.type as AccountType,
          balance: values.balance,
          currency: values.currency,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setOpen(false);
      setEditing(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  });

  function openCreate() {
    setEditing(null);
    form.reset({ name: "", type: "checking", balance: 0, currency: "ZAR" });
    setOpen(true);
  }

  function openEdit(account: Account) {
    setEditing(account);
    form.reset({
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
    });
    setOpen(true);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Accounts"
        description="Manage checking, savings, credit, and cash."
        action={<Button onClick={openCreate}>Add account</Button>}
      />

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading accounts...</p>
      ) : accounts.length === 0 ? (
        <Card>No accounts yet. Add your first one to get started.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white">{account.name}</p>
                  <p className="text-xs uppercase text-zinc-500">{account.type.replace("_", " ")}</p>
                </div>
                <p className="text-lg font-semibold">
                  {formatCurrency(account.balance, account.currency)}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  className="min-h-10 flex-1 text-xs sm:flex-none"
                  onClick={() => openEdit(account)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  className="min-h-10 flex-1 text-xs sm:flex-none"
                  onClick={() => deleteMutation.mutate(account.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit account" : "Add account"}
      >
        <form
          onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))}
          className="space-y-4"
        >
          <div>
            <Label>Name</Label>
            <Input {...form.register("name")} />
          </div>
          <div>
            <Label>Type</Label>
            <Select {...form.register("type")}>
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="credit_card">Credit card</option>
              <option value="cash">Cash</option>
            </Select>
          </div>
          {!editing && (
            <div>
              <Label>Starting balance</Label>
              <Input type="number" step="0.01" {...form.register("balance")} />
            </div>
          )}
          <div>
            <Label>Currency</Label>
            <Input {...form.register("currency")} />
          </div>
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
