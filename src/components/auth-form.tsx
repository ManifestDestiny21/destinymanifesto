"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import {
  getHomePath,
  getUserRole,
  roleLabel,
  type UserRole,
} from "@/lib/auth/roles";

type Props = {
  mode: "login" | "signup";
  role?: "employer" | "job-seeker";
};

function expectedRole(role: "employer" | "job-seeker"): UserRole {
  return role === "job-seeker" ? "job_seeker" : "employer";
}

export function AuthForm({ mode, role = "employer" }: Props) {
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountRole = expectedRole(role);
  const isJobSeeker = accountRole === "job_seeker";
  const title =
    mode === "login"
      ? isJobSeeker
        ? "Destiny Manifesto Job Seeker Login"
        : "Destiny Manifesto Employer Login"
      : isJobSeeker
        ? "Destiny Manifesto Job Seeker Signup"
        : "Destiny Manifesto Employer Signup";
  const postSignupPath = isJobSeeker ? "/onboarding" : "/profile";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                data: { role: accountRole },
              },
            });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      if (mode === "login" && result.data.user) {
        const actualRole = getUserRole(result.data.user);
        if (actualRole && actualRole !== accountRole) {
          await supabase.auth.signOut();
          setError(
            `This account is registered as ${roleLabel(actualRole)}. Use the ${roleLabel(actualRole)} sign-in option on the welcome page.`
          );
          return;
        }

        router.push(actualRole ? getHomePath(actualRole) : getHomePath(accountRole));
      } else {
        router.push(postSignupPath);
      }

      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-2xl font-semibold">{title}</h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder={isJobSeeker ? "you@example.com" : "employer@example.com"}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            type="password"
            required
            minLength={mode === "signup" ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder={mode === "signup" ? "Minimum 8 characters" : undefined}
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
