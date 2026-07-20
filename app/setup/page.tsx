import Link from "next/link";
import { MarketingShell } from "@/components/layout/marketing-shell";

export default function SetupPage() {
  return (
    <MarketingShell>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
          Setup
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white md:text-5xl">
          Connect Supabase
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-zinc-400">
          The app needs your Supabase project URL and publishable key before auth
          and data features will work.
        </p>

        <ol className="mt-8 list-decimal space-y-4 pl-5 text-sm leading-relaxed text-zinc-300">
          <li>
            Create a project at{" "}
            <a
              href="https://supabase.com/dashboard"
              className="font-medium text-violet-300 hover:text-violet-200"
              target="_blank"
              rel="noreferrer"
            >
              supabase.com/dashboard
            </a>
          </li>
          <li>
            Copy <strong className="text-white">Project URL</strong> and{" "}
            <strong className="text-white">publishable key</strong> from API settings.
          </li>
          <li>
            Save them in{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-violet-200">.env.local</code>
          </li>
          <li>Restart the dev server</li>
          <li>Run the SQL migration in Supabase SQL Editor</li>
        </ol>

        <pre className="mt-8 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs text-zinc-300">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`}
        </pre>

        <p className="mt-8 text-sm text-zinc-500">
          After setup,{" "}
          <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">
            continue to login
          </Link>
          .
        </p>
      </div>
    </MarketingShell>
  );
}
