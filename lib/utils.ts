export function formatCurrency(amount: number, currency = "ZAR") {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function formatMonthYear(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function advanceDueDate(
  dueDate: string,
  frequency: "weekly" | "monthly" | "custom",
  customIntervalDays?: number | null
): string {
  const d = new Date(dueDate);
  if (frequency === "weekly") {
    d.setDate(d.getDate() + 7);
  } else if (frequency === "monthly") {
    d.setMonth(d.getMonth() + 1);
  } else if (frequency === "custom" && customIntervalDays) {
    d.setDate(d.getDate() + customIntervalDays);
  }
  return d.toISOString().split("T")[0];
}

export function projectedCompletionDate(
  current: number,
  target: number,
  contributions: { amount: number; contributed_at: string }[]
): Date | null {
  const remaining = target - current;
  if (remaining <= 0) return new Date();

  if (contributions.length === 0) return null;

  const sorted = [...contributions].sort(
    (a, b) => new Date(a.contributed_at).getTime() - new Date(b.contributed_at).getTime()
  );
  const first = new Date(sorted[0].contributed_at);
  const last = new Date(sorted[sorted.length - 1].contributed_at);
  const days = Math.max(1, (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
  const total = contributions.reduce((s, c) => s + c.amount, 0);
  const dailyRate = total / days;
  if (dailyRate <= 0) return null;

  const daysNeeded = Math.ceil(remaining / dailyRate);
  return addDays(new Date(), daysNeeded);
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
