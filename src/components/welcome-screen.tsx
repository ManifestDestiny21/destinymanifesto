"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LegalFooter } from "@/components/legal-footer";

type AccountType = "user" | "employer";

function authPaths(accountType: AccountType) {
  if (accountType === "employer") {
    return { login: "/login", signup: "/signup" };
  }

  return { login: "/login?role=job-seeker", signup: "/signup?role=job-seeker" };
}

export function WelcomeScreen() {
  const [accountType, setAccountType] = useState<AccountType>("user");
  const paths = authPaths(accountType);

  const accountLabel =
    accountType === "employer" ? "Employer" : "Job Seeker";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-6 py-10">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <BrandLogo />

        <p className="mt-5 text-lg font-medium tracking-wide text-[#1570ef]">
          Manifest your destiny
        </p>

        <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
          {accountType === "employer"
            ? "Post jobs, build your company profile, and connect with second-chance talent."
            : "Discover opportunities and take the next step in your career journey."}
        </p>

        <div
          className="mt-8 inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm"
          role="tablist"
          aria-label="Account type"
        >
          <button
            type="button"
            role="tab"
            aria-selected={accountType === "user"}
            onClick={() => setAccountType("user")}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              accountType === "user"
                ? "bg-[#1570ef] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Job Seeker
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={accountType === "employer"}
            onClick={() => setAccountType("employer")}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              accountType === "employer"
                ? "bg-[#1570ef] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Employer
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Signing in as <span className="font-medium text-slate-700">{accountLabel}</span>
        </p>

        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          <Link
            href={paths.login}
            className="w-full rounded-xl bg-[#1570ef] px-6 py-3 text-center text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-[#125ecc]"
          >
            Sign in
          </Link>
          <Link
            href={paths.signup}
            className="w-full rounded-xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Create an account
          </Link>
        </div>
      </div>

      <LegalFooter />
    </main>
  );
}
