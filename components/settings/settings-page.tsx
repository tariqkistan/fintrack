"use client";

import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

export function SettingsPage() {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Settings"
        description="Account and app preferences."
      />

      <Card className="space-y-6">
        <div>
          <h2 className="font-semibold text-white">Supabase setup</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Copy <code className="rounded bg-white/10 px-1.5 py-0.5 text-violet-200">.env.local.example</code> to{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-violet-200">.env.local</code> and add your project URL
            and publishable key from Supabase Project Settings → API.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-white">Generate types</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            After running migrations:{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-violet-200">
              npx supabase gen types typescript --local &gt; lib/types/database.ts
            </code>
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-white">MCP server</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Run <code className="rounded bg-white/10 px-1.5 py-0.5 text-violet-200">npm run mcp</code> to expose financial
            data tools for AI assistants.
          </p>
        </div>
        <Button variant="danger" onClick={signOut}>
          Sign out
        </Button>
      </Card>
    </div>
  );
}
