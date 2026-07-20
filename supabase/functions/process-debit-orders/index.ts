import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

function advanceDueDate(
  dueDate: string,
  frequency: "weekly" | "monthly" | "custom",
  customIntervalDays?: number | null
): string {
  const d = new Date(dueDate);
  if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  else if (frequency === "custom" && customIntervalDays)
    d.setDate(d.getDate() + customIntervalDays);
  return d.toISOString().split("T")[0];
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date().toISOString().split("T")[0];

  const { data: dueOrders, error } = await supabase
    .from("debit_orders")
    .select("*")
    .eq("active", true)
    .lte("next_due_date", today);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const processed: string[] = [];

  for (const order of dueOrders ?? []) {
    const { data: account } = await supabase
      .from("accounts")
      .select("balance")
      .eq("id", order.account_id)
      .single();

    if (!account) continue;

    const newBalance = Number(account.balance) - Number(order.amount);

    await supabase.from("transactions").insert({
      user_id: order.user_id,
      account_id: order.account_id,
      category_id: order.category_id,
      amount: order.amount,
      type: "expense",
      note: `Auto: ${order.name}`,
      occurred_at: new Date().toISOString(),
      debit_order_id: order.id,
    });

    await supabase
      .from("accounts")
      .update({ balance: newBalance })
      .eq("id", order.account_id);

    await supabase
      .from("debit_orders")
      .update({
        next_due_date: advanceDueDate(
          order.next_due_date,
          order.frequency,
          order.custom_interval_days
        ),
      })
      .eq("id", order.id);

    processed.push(order.id);
  }

  return new Response(JSON.stringify({ processed: processed.length, ids: processed }), {
    headers: { "Content-Type": "application/json" },
  });
});
