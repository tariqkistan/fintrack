import type { TransactionType } from "@/lib/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

type Client = SupabaseClient<Database>;

export async function adjustAccountBalance(
  supabase: Client,
  accountId: string,
  amount: number,
  type: TransactionType,
  direction: "apply" | "reverse"
) {
  const { data: account, error: fetchError } = await supabase
    .from("accounts")
    .select("balance")
    .eq("id", accountId)
    .single();

  if (fetchError || !account) throw fetchError ?? new Error("Account not found");

  const delta = type === "income" ? amount : -amount;
  const signedDelta = direction === "apply" ? delta : -delta;
  const newBalance = Number(account.balance) + signedDelta;

  const { error } = await supabase
    .from("accounts")
    .update({ balance: newBalance })
    .eq("id", accountId);

  if (error) throw error;
}

export async function createTransactionWithBalance(
  supabase: Client,
  payload: {
    user_id: string;
    account_id: string;
    category_id?: string | null;
    amount: number;
    type: TransactionType;
    note?: string | null;
    occurred_at?: string;
    debit_order_id?: string | null;
  }
) {
  const { data, error } = await supabase
    .from("transactions")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  await adjustAccountBalance(
    supabase,
    payload.account_id,
    payload.amount,
    payload.type,
    "apply"
  );

  return data;
}

export async function deleteTransactionWithBalance(
  supabase: Client,
  transaction: {
    id: string;
    account_id: string;
    amount: number;
    type: TransactionType;
  }
) {
  await adjustAccountBalance(
    supabase,
    transaction.account_id,
    transaction.amount,
    transaction.type,
    "reverse"
  );

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transaction.id);

  if (error) throw error;
}
