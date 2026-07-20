"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { MarketingShell } from "@/components/layout/marketing-shell";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setConfirmEmail(true);
    }
  }

  return (
    <MarketingShell>
      <div>
        <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
          <span className="void-gradient-text">Start tracking</span>
          <br />
          in one command
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-zinc-400">
          Create your account and take control of accounts, spending, debit orders,
          and savings goals.
        </p>

        <div className="mt-10 void-glass rounded-xl p-6">
          {confirmEmail ? (
            <p className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-4 text-sm text-violet-200">
              Check your email to confirm your account, then sign in.
            </p>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
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
                  minLength={6}
                  required
                  placeholder="Min. 6 characters"
                />
              </div>
              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create account"}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-violet-300 hover:text-violet-200">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </MarketingShell>
  );
}
