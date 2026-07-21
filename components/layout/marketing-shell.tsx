import Link from "next/link";

export function MarketingShell({
  children,
  preview,
}: {
  children: React.ReactNode;
  preview?: React.ReactNode;
}) {
  return (
    <div className="void-bg min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-bold tracking-tight text-white">
          FINTRACK.
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <Link href="/login" className="transition hover:text-white">
            Sign in
          </Link>
          <Link href="/signup" className="transition hover:text-white">
            Sign up
          </Link>
        </nav>
      </header>

      <main className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-8 lg:grid-cols-2 lg:items-center lg:gap-16 lg:pt-16">
        <div>{children}</div>
        {preview ?? <FinancePreview />}
      </main>

      <footer className="border-t border-white/5 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="void-cta-gradient rounded-2xl px-8 py-16 text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Track at warp speed
            </h2>
            <p className="mt-3 text-zinc-400">
              Accounts. Transactions. Goals. All in one place.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-100"
            >
              Get Started
            </Link>
          </div>
          <p className="mt-12 text-center text-xs text-zinc-600">
            © {new Date().getFullYear()} Fintrack. Personal finance tracker.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FinancePreview() {
  return (
    <div className="void-glow-panel relative overflow-hidden rounded-2xl p-1">
      <div className="rounded-xl bg-[#0a0a0a]/90 p-5 font-mono text-xs">
        <div className="mb-4 flex gap-2 border-b border-white/5 pb-3">
          {["Dashboard", "Accounts", "Transactions"].map((tab, i) => (
            <span
              key={tab}
              className={
                i === 0
                  ? "rounded-md bg-violet-500/20 px-2 py-1 text-violet-300"
                  : "px-2 py-1 text-zinc-500"
              }
            >
              {tab}
            </span>
          ))}
        </div>
        <div className="space-y-1 text-zinc-500">
          <div className="text-zinc-400">accounts/</div>
          <div className="pl-4 text-zinc-300">checking.tsx</div>
          <div className="pl-4 text-zinc-300">savings.tsx</div>
          <div className="mt-3 text-zinc-400">transactions/</div>
          <div className="pl-4 text-zinc-300">march-2026/</div>
          <div className="pl-8 text-emerald-400/80">+ salary.server.ts</div>
          <div className="pl-8 text-red-400/80">- rent.server.ts</div>
          <div className="mt-3 text-zinc-400">goals/</div>
          <div className="pl-4 text-zinc-300">emergency-fund.ts</div>
          <div className="pl-4 text-zinc-300">date-night.ts</div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-white/5 bg-white/5 p-3">
            <p className="text-zinc-500">Net worth</p>
            <p className="mt-1 text-lg font-semibold text-white">R24,580</p>
          </div>
          <div className="rounded-lg border border-white/5 bg-white/5 p-3">
            <p className="text-zinc-500">This month</p>
            <p className="mt-1 text-lg font-semibold text-violet-300">-R2,140</p>
          </div>
        </div>
      </div>
    </div>
  );
}
