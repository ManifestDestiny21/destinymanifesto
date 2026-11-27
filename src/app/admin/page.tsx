import Link from "next/link";
import { dismissJobReports, setEmployerStatus, setJobHidden } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const REASON_LABELS: Record<string, string> = {
  scam: "Looks like a scam",
  asks_for_money: "Asks for money",
  personal_info: "Asks for bank/SSN info",
  misleading: "Misleading",
  offensive: "Offensive",
  other: "Other",
};

type Company = {
  user_id: string;
  company_name: string;
  website: string | null;
  location: string | null;
  description: string | null;
  approval_status: string;
  created_at: string;
};

type Report = {
  id: string;
  job_id: string;
  reason: string;
  details: string | null;
  created_at: string;
  jobs: { title: string; employer_id: string; hidden: boolean } | null;
};

type HiddenJob = { id: string; title: string; hidden_reason: string | null; employer_id: string };

const button = "rounded-md px-3 py-1.5 text-xs font-semibold";

export default async function AdminPage() {
  await requireAdmin();
  const admin = createAdminClient();

  if (!admin) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="mt-4 text-sm text-red-700">
          SUPABASE_SERVICE_ROLE_KEY is not configured on the server.
        </p>
      </main>
    );
  }

  const [pending, rejected, reports, hiddenJobs] = await Promise.all([
    admin
      .from("company_profiles")
      .select("user_id, company_name, website, location, description, approval_status, created_at")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: true }),
    admin
      .from("company_profiles")
      .select("user_id, company_name, website, location, description, approval_status, created_at")
      .eq("approval_status", "rejected")
      .order("reviewed_at", { ascending: false })
      .limit(20),
    admin
      .from("job_reports")
      .select("id, job_id, reason, details, created_at, jobs(title, employer_id, hidden)")
      .eq("status", "open")
      .order("created_at", { ascending: true }),
    admin
      .from("jobs")
      .select("id, title, hidden_reason, employer_id")
      .eq("hidden", true)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const loadError = pending.error ?? rejected.error ?? reports.error ?? hiddenJobs.error;
  if (loadError) {
    console.error("[admin] load:", loadError.message);
  }

  const pendingCompanies = (pending.data ?? []) as Company[];
  const emails = new Map<string, string>();
  await Promise.all(
    pendingCompanies.map(async (company) => {
      const { data } = await admin.auth.admin.getUserById(company.user_id);
      if (data.user?.email) emails.set(company.user_id, data.user.email);
    })
  );

  // Group open reports by job.
  const reportsByJob = new Map<string, Report[]>();
  for (const report of (reports.data ?? []) as unknown as Report[]) {
    const list = reportsByJob.get(report.job_id) ?? [];
    list.push(report);
    reportsByJob.set(report.job_id, list);
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl space-y-10 px-6 py-10">
      <header>
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
          ← Destiny Manifesto
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Admin</h1>
        <p className="text-slate-600">Approve employers and review reported listings.</p>
        {loadError ? (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            Some data couldn&apos;t load. Have the database migrations been applied (supabase/README.md)?
          </p>
        ) : null}
      </header>

      <section>
        <h2 className="text-xl font-semibold">Employers waiting for approval ({pendingCompanies.length})</h2>
        <p className="mt-1 text-sm text-slate-600">
          Their jobs stay hidden from job seekers until approved. Check the website and
          email domain match the company before approving.
        </p>
        <div className="mt-4 space-y-3">
          {pendingCompanies.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing waiting.</p>
          ) : (
            pendingCompanies.map((company) => (
              <CompanyCard key={company.user_id} company={company} email={emails.get(company.user_id)}>
                <StatusButton userId={company.user_id} status="approved" label="Approve" className="bg-emerald-700 text-white" />
                <StatusButton userId={company.user_id} status="rejected" label="Reject" className="border border-red-300 text-red-800" />
              </CompanyCard>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Reported listings ({reportsByJob.size})</h2>
        <p className="mt-1 text-sm text-slate-600">
          Listings are hidden automatically after 3 separate reports.
        </p>
        <div className="mt-4 space-y-3">
          {reportsByJob.size === 0 ? (
            <p className="text-sm text-slate-500">No open reports.</p>
          ) : (
            [...reportsByJob.entries()].map(([jobId, jobReports]) => {
              const job = jobReports[0].jobs;
              return (
                <div key={jobId} className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{job?.title ?? "Deleted job"}</p>
                      <p className="text-xs text-slate-500">
                        {jobReports.length} report{jobReports.length === 1 ? "" : "s"}
                        {job?.hidden ? " · currently hidden" : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {job && !job.hidden ? (
                        <form action={setJobHidden}>
                          <input type="hidden" name="jobId" value={jobId} />
                          <input type="hidden" name="hidden" value="true" />
                          <input type="hidden" name="reason" value="Hidden after a report review" />
                          <button className={`${button} bg-red-700 text-white`}>Hide listing</button>
                        </form>
                      ) : null}
                      <form action={dismissJobReports}>
                        <input type="hidden" name="jobId" value={jobId} />
                        <button className={`${button} border border-slate-300`}>Dismiss reports</button>
                      </form>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm">
                    {jobReports.map((report) => (
                      <li key={report.id}>
                        <strong>{REASON_LABELS[report.reason] ?? report.reason}</strong>
                        {report.details ? <> — {report.details}</> : null}
                        <span className="text-xs text-slate-400">
                          {" "}
                          · {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Hidden listings</h2>
        <div className="mt-4 space-y-2">
          {(hiddenJobs.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">None.</p>
          ) : (
            ((hiddenJobs.data ?? []) as HiddenJob[]).map((job) => (
              <div key={job.id} className="flex items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm">
                <div>
                  <p className="text-sm font-medium">{job.title}</p>
                  <p className="text-xs text-slate-500">{job.hidden_reason}</p>
                </div>
                <form action={setJobHidden}>
                  <input type="hidden" name="jobId" value={job.id} />
                  <input type="hidden" name="hidden" value="false" />
                  <button className={`${button} border border-slate-300`}>Restore</button>
                </form>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Recently rejected employers</h2>
        <div className="mt-4 space-y-3">
          {(rejected.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">None.</p>
          ) : (
            ((rejected.data ?? []) as Company[]).map((company) => (
              <CompanyCard key={company.user_id} company={company}>
                <StatusButton userId={company.user_id} status="approved" label="Approve instead" className="border border-slate-300" />
              </CompanyCard>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function CompanyCard({
  company,
  email,
  children,
}: {
  company: Company;
  email?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="min-w-0 max-w-xl">
        <p className="font-semibold">{company.company_name}</p>
        <p className="text-xs text-slate-500">
          {[email, company.location, new Date(company.created_at).toLocaleDateString()]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {company.website && /^https?:\/\//i.test(company.website) ? (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-xs text-blue-700 underline"
          >
            {company.website}
          </a>
        ) : (
          <p className="text-xs text-amber-700">
            {company.website ? `Unusual website: ${company.website}` : "No website given"}
          </p>
        )}
        {company.description ? (
          <p className="mt-2 line-clamp-3 text-sm text-slate-700">{company.description}</p>
        ) : null}
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function StatusButton({
  userId,
  status,
  label,
  className,
}: {
  userId: string;
  status: "approved" | "rejected";
  label: string;
  className: string;
}) {
  return (
    <form action={setEmployerStatus}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="status" value={status} />
      <button className={`${button} ${className}`}>{label}</button>
    </form>
  );
}
