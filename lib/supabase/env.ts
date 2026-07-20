const PLACEHOLDER_VALUES = new Set([
  "https://your-project.supabase.co",
  "your-anon-key",
  "your-publishable-key",
  "your-service-role-key",
]);

/** Supports both new publishable key and legacy anon key env names. */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  return { url, key };
}

export function isSupabaseConfigured() {
  const { url, key } = getSupabaseEnv();

  if (!url || !key) return false;
  if (PLACEHOLDER_VALUES.has(url) || PLACEHOLDER_VALUES.has(key)) return false;

  return true;
}

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Copy .env.local.example to .env.local and add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from https://supabase.com/dashboard/project/_/settings/api"
    );
  }

  const { url, key } = getSupabaseEnv();
  return { url: url!, key: key! };
}
