"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { MarketingShell } from "@/components/layout/marketing-shell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleMagicLink() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setMagicSent(true);
  }

  return (
    <MarketingShell>
      <div>
        <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
          <span className="void-gradient-text">Ship your finances</span>
          <br />
          at warp speed
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-zinc-400">
          A personal finance tracker designed for clarity. Accounts, transactions,
          goals — all in one dashboard.
        </p>

        <div className="mt-10 void-glass rounded-xl p-6">
          {magicSent ? (
            <p className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-4 text-sm text-violet-200">
              Check your email for a magic link to sign in.
            </p>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Get Started"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={loading || !email}
                onClick={handleMagicLink}
              >
                Send magic link
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-zinc-500">
            No account?{" "}
            <Link href="/signup" className="font-medium text-violet-300 hover:text-violet-200">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </MarketingShell>
  );
}
