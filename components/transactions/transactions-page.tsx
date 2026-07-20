"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  createTransactionWithBalance,
  deleteTransactionWithBalance,
  updateTransactionWithBalance,
} from "@/lib/finance";
import type { Account, Category, Transaction, TransactionType } from "@/lib/types/database";
import { formatCurrency, formatDate, getMonthRange, formatMonthYear } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { addMonths, subMonths } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";

import { formPositiveNumber } from "@/lib/validators";

const txSchema = z.object({
  account_id: z.string().min(1),
  category_id: z.string().optional(),
  amount: formPositiveNumber(),
  type: z.enum(["income", "expense"]),
  note: z.string().optional(),
  occurred_at: z.string().min(1),
});

type TxForm = z.infer<typeof txSchema>;

const categorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["income", "expense"]),
  color: z.string().min(4),
});

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TransactionsPage() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(new Date());
  const [txOpen, setTxOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");

  const range = getMonthRange(month);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("accounts").select("*");
      if (error) throw error;
      return data as Account[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", month.toISOString()],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("transactions")
        .select("*, account:accounts(*), category:categories(*)")
        .gte("occurred_at", range.start.toISOString())
        .lte("occurred_at", range.end.toISOString())
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    },
  });

  const filtered = useMemo(
    () => transactions.filter((t) => typeFilter === "all" || t.type === typeFilter),
    [transactions, typeFilter]
  );

  const txForm = useForm({
    resolver: zodResolver(txSchema),
    defaultValues: {
      type: "expense" as const,
      occurred_at: new Date().toISOString().slice(0, 16),
    },
  });

  const catForm = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", type: "expense" as const, color: "#6366f1" },
  });

  const txType = txForm.watch("type");
  const filteredCategories = categories.filter((c) => c.type === txType);

  const saveTx = useMutation({
    mutationFn: async (values: TxForm) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (editingTx) {
        await updateTransactionWithBalance(supabase, editingTx, {
          account_id: values.account_id,
          category_id: values.category_id || null,
          amount: values.amount,
          type: values.type,
          note: values.note || null,
          occurred_at: new Date(values.occurred_at).toISOString(),
        });
      } else {
        await createTransactionWithBalance(supabase, {
          user_id: user.id,
          account_id: values.account_id,
          category_id: values.category_id || null,
          amount: values.amount,
          type: values.type,
          note: values.note || null,
          occurred_at: new Date(values.occurred_at).toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setTxOpen(false);
      setEditingTx(null);
      txForm.reset({ type: "expense", occurred_at: new Date().toISOString().slice(0, 16) });
    },
  });

  const deleteTx = useMutation({
    mutationFn: async (tx: Transaction) => {
      const supabase = createClient();
      await deleteTransactionWithBalance(supabase, tx);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const createCategory = useMutation({
    mutationFn: async (values: z.infer<typeof categorySchema>) => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("categories").insert({
        user_id: user.id,
        ...values,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      catForm.reset({ name: "", type: "expense", color: "#6366f1" });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  function openCreateTx() {
    setEditingTx(null);
    txForm.reset({
      type: "expense",
      occurred_at: new Date().toISOString().slice(0, 16),
    });
    setTxOpen(true);
  }

  function openEditTx(tx: Transaction) {
    setEditingTx(tx);
    txForm.reset({
      account_id: tx.account_id,
      category_id: tx.category_id ?? undefined,
      amount: tx.amount,
      type: tx.type,
      note: tx.note ?? undefined,
      occurred_at: toDatetimeLocal(tx.occurred_at),
    });
    setTxOpen(true);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Transactions"
        description="Track income and expenses with monthly filters."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCatOpen(true)}>
              Categories
            </Button>
            <Button onClick={openCreateTx}>Add transaction</Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={() => setMonth(subMonths(month, 1))}>
          ←
        </Button>
        <span className="font-medium">{formatMonthYear(month)}</span>
        <Button variant="ghost" onClick={() => setMonth(addMonths(month, 1))}>
          →
        </Button>
        <Select
          className="w-auto"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
        >
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <Card>No transactions this month.</Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((tx) => (
            <Card key={tx.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-white">{tx.category?.name ?? "Uncategorized"}</p>
                <p className="text-xs text-zinc-500">
                  {tx.account?.name} · {formatDate(tx.occurred_at)}
                  {tx.note ? ` · ${tx.note}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={
                    tx.type === "income" ? "font-semibold text-emerald-400" : "font-semibold text-red-400"
                  }
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatCurrency(tx.amount)}
                </span>
                <Button variant="secondary" className="text-xs" onClick={() => openEditTx(tx)}>
                  Edit
                </Button>
                <Button variant="ghost" className="text-xs" onClick={() => deleteTx.mutate(tx)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={txOpen}
        onClose={() => {
          setTxOpen(false);
          setEditingTx(null);
        }}
        title={editingTx ? "Edit transaction" : "Add transaction"}
      >
        <form onSubmit={txForm.handleSubmit((v) => saveTx.mutate(v))} className="space-y-4">
          <div>
            <Label>Type</Label>
            <Select {...txForm.register("type")}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </Select>
          </div>
          <div>
            <Label>Account</Label>
            <Select {...txForm.register("account_id")}>
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Select {...txForm.register("category_id")}>
              <option value="">Uncategorized</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Amount</Label>
            <Input type="number" step="0.01" {...txForm.register("amount")} />
          </div>
          <div>
            <Label>Date</Label>
            <Input type="datetime-local" {...txForm.register("occurred_at")} />
          </div>
          <div>
            <Label>Note</Label>
            <Textarea {...txForm.register("note")} />
          </div>
          <Button type="submit" disabled={saveTx.isPending}>
            Save
          </Button>
        </form>
      </Modal>

      <Modal open={catOpen} onClose={() => setCatOpen(false)} title="Manage categories">
        <form
          onSubmit={catForm.handleSubmit((v) => createCategory.mutate(v))}
          className="mb-6 space-y-3 border-b border-zinc-200 pb-6 dark:border-zinc-800"
        >
          <div>
            <Label>Name</Label>
            <Input {...catForm.register("name")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select {...catForm.register("type")}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </Select>
            </div>
            <div>
              <Label>Color</Label>
              <Input type="color" {...catForm.register("color")} />
            </div>
          </div>
          <Button type="submit">Add category</Button>
        </form>
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: c.color }} />
                {c.name} <span className="text-zinc-400">({c.type})</span>
              </div>
              <Button
                variant="danger"
                className="text-xs"
                onClick={() => deleteCategory.mutate(c.id)}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
