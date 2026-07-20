import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";
import { assertSupabaseConfigured } from "@/lib/supabase/env";

export function createClient() {
  const { url, key } = assertSupabaseConfigured();
  return createBrowserClient<Database>(url, key);
}
