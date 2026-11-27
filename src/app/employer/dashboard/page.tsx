import Link from "next/link";
import { JobsTable } from "@/components/jobs-table";
import { LogoutButton } from "@/components/logout-button";
import { DbJob } from "@/lib/types";
import { requireRole } from "@/lib/auth/guards";
import {
  getCompanyProfile,
  hasCompleteCompanyProfile,
} from "@/lib/employer/company-profile";

export default async function EmployerDashboardPage() {
  const { supabase, user } = await requireRole("employer");
  const company = await getCompanyProfile(supabase, user.id);
  const canPostJobs = hasCompleteCompanyProfile(company);

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("employer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[employer dashboard] load jobs:", error.message);
    throw new Error("Could not load your jobs.");
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/" className="mb-2 inline-block text-sm text-slate-500 hover:text-slate-800">
            ← Destiny Manifesto
          </Link>
          <h1 className="text-3xl font-bold">Employer Dashboard</h1>
          <p className="text-slate-600">Manage your active job listings.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/profile" className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            Company Profile
          </Link>
          {canPostJobs ? (
            <Link href="/jobs/new" className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white">
              New Job
            </Link>
          ) : (
            <Link
              href="/profile?setup=required"
              className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white"
            >
              Set up profile
            </Link>
          )}
          <LogoutButton />
        </div>
      </header>

      {canPostJobs && company?.approval_status === "pending" ? (
        <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <strong>Your company is being reviewed.</strong> You can post jobs now; they&apos;ll
          become visible to job seekers once your account is approved. This helps keep job
          seekers safe from fake listings.
        </div>
      ) : null}

      {company?.approval_status === "rejected" ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <strong>Your company wasn&apos;t approved,</strong> so your listings aren&apos;t shown
          to job seekers. Update your company profile with a website and description, or
          contact support to ask for another review.
        </div>
      ) : null}

      {!canPostJobs ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Add your company profile before posting jobs.{" "}
          <Link href="/profile?setup=required" className="font-medium underline">
            Complete profile →
          </Link>
        </div>
      ) : null}

      <JobsTable jobs={(jobs ?? []) as DbJob[]} canPostJobs={canPostJobs} />
    </main>
  );
}
