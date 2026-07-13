import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import { fetchSavedJobsForUser, formatAppliedDate } from "@/lib/job-applications";
import type { ApplicationStatus } from "@/lib/types";

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: "bg-[#7a7974]/15 text-[#7a7974]",
  applied: "bg-[#01696f]/15 text-[#01696f]",
  interview: "bg-[#b8860b]/20 text-[#964219]",
  offer: "bg-[#437a22]/15 text-[#437a22]",
  closed: "bg-[#a12c7b]/15 text-[#a12c7b]",
};

export default async function SavedJobsPage() {
  const { supabase, user } = await requireRole("job_seeker");
  const entries = await fetchSavedJobsForUser(supabase, user.id);

  return (
    <div>
      <PageHeader
        title="Saved jobs & applications"
        subtitle="Track where you've saved, applied, and interviewed."
      />
      {entries.length === 0 ? (
        <Card>
          <p className="text-sm text-[#7a7974]">
            No saved jobs or applications yet. Browse the{" "}
            <Link href="/jobs" className="font-medium text-[#01696f] hover:underline">
              job board
            </Link>{" "}
            to save listings or apply.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map(({ application, job }) => (
            <Card key={application.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/jobs/${job.id}`} className="font-semibold hover:text-[#01696f]">
                    {job.title}
                  </Link>
                  <p className="text-sm text-[#7a7974]">{job.employer}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_COLORS[application.status]}`}
                >
                  {application.status}
                </span>
              </div>
              {application.applied_at ? (
                <p className="mt-2 text-xs text-[#7a7974]">
                  Applied {formatAppliedDate(application.applied_at)}
                </p>
              ) : null}
              {application.note ? (
                <p className="mt-2 text-sm text-[#28251d]">
                  <span className="font-medium">Your note:</span> {application.note}
                </p>
              ) : null}
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/jobs/${job.id}`}
                  className="rounded-xl bg-[#01696f] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  View job
                </Link>
                <Link
                  href="/messages/compose"
                  className="rounded-xl border px-3 py-1.5 text-xs font-semibold"
                >
                  Follow up
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
