"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const primaryNav = [
  {
    href: "/dashboard",
    label: "Home",
    match: (path: string) => path.startsWith("/dashboard"),
    icon: HomeIcon,
  },
  {
    href: "/transactions",
    label: "Money",
    match: (path: string) => path.startsWith("/transactions"),
    icon: MoneyIcon,
  },
  {
    href: "/accounts",
    label: "Accounts",
    match: (path: string) => path.startsWith("/accounts"),
    icon: WalletIcon,
  },
] as const;

const moreNav = [
  { href: "/debit-orders", label: "Debit orders", hint: "Recurring bills" },
  { href: "/goals", label: "Goals", hint: "Savings targets" },
  { href: "/date-night", label: "Date night", hint: "Ideas & budget" },
  { href: "/settings", label: "Settings", hint: "Account & setup" },
] as const;

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}

function MoneyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M17 8.5c0-1.9-2.2-3.5-5-3.5s-5 1.6-5 3.5 2.2 3.5 5 3.5 5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.6-5-3.5" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a1 1 0 0 1 1 1v1.5M3 7.5V18a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6.5a1 1 0 0 0-1-1h-4.5a1.5 1.5 0 0 0 0 3H21" />
    </svg>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = moreNav.some((item) => pathname.startsWith(item.href));

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [moreOpen]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="void-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0b0b0b]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 md:h-16 md:px-6">
          <Link href="/dashboard" className="shrink-0 text-base font-bold tracking-tight text-white md:text-lg">
            FINTRACK.
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {[
              { href: "/dashboard", label: "Dashboard" },
              { href: "/accounts", label: "Accounts" },
              { href: "/transactions", label: "Transactions" },
              { href: "/debit-orders", label: "Debit Orders" },
              { href: "/goals", label: "Goals" },
              { href: "/date-night", label: "Date Night" },
              { href: "/settings", label: "Settings" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  pathname.startsWith(item.href)
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Button variant="ghost" className="hidden shrink-0 lg:inline-flex" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-5 md:px-6 md:py-10 lg:pb-10">
        {children}
      </main>

      <footer className="hidden border-t border-white/5 px-6 py-8 lg:block">
        <div className="mx-auto max-w-7xl text-center text-xs text-zinc-600">
          Fintrack — personal finance at warp speed
        </div>
      </footer>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0b0b0b]/95 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 py-1.5">
          {primaryNav.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-medium transition",
                  active ? "bg-white/10 text-white" : "text-zinc-500 active:bg-white/5 active:text-zinc-300"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-medium transition",
              moreActive || moreOpen
                ? "bg-white/10 text-white"
                : "text-zinc-500 active:bg-white/5 active:text-zinc-300"
            )}
          >
            <MoreIcon className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* More sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-white/10 bg-[#111] px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="More"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">More</p>
            <ul className="space-y-1">
              {moreNav.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex min-h-14 items-center justify-between rounded-xl px-3 py-3 transition",
                        active ? "bg-white/10 text-white" : "text-zinc-200 active:bg-white/5"
                      )}
                    >
                      <span>
                        <span className="block text-sm font-medium capitalize">{item.label}</span>
                        <span className="block text-xs text-zinc-500">{item.hint}</span>
                      </span>
                      <span className="text-zinc-600">›</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Button variant="danger" className="mt-4 w-full min-h-12" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
