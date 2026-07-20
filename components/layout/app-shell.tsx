"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/accounts", label: "Accounts" },
  { href: "/transactions", label: "Transactions" },
  { href: "/debit-orders", label: "Debit Orders" },
  { href: "/goals", label: "Goals" },
  { href: "/date-night", label: "Date Night" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="void-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0b0b0b]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link href="/dashboard" className="shrink-0 text-lg font-bold tracking-tight text-white">
            FINTRACK.
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  pathname === item.href
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Button variant="ghost" className="hidden shrink-0 sm:inline-flex" onClick={signOut}>
            Sign out
          </Button>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 lg:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition",
                pathname === item.href
                  ? "bg-violet-500/20 text-violet-200"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6 md:py-10">
        {children}
      </main>

      <footer className="border-t border-white/5 px-6 py-8">
        <div className="mx-auto max-w-7xl text-center text-xs text-zinc-600">
          Fintrack — personal finance at warp speed
        </div>
      </footer>
    </div>
  );
}
