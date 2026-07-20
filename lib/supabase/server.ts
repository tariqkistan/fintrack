import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";
import { assertSupabaseConfigured } from "@/lib/supabase/env";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = assertSupabaseConfigured();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — middleware handles session refresh.
        }
      },
    },
  });
}

export function createServiceClient() {
  const { url } = assertSupabaseConfigured();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!serviceKey || serviceKey === "your-service-role-key") {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured in .env.local");
  }

  return createServerClient<Database>(url, serviceKey, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });
}
