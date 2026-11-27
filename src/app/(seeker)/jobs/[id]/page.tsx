import Link from "next/link";
import { notFound } from "next/navigation";
import { FelonyRating } from "@/components/felony-rating";
import { JobActions } from "@/components/job-actions";
import { ReportJobButton } from "@/components/report-job-button";
import { AiBadge } from "@/components/ui/ai-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/disclaimer";
import { requireRole } from "@/lib/auth/guards";
import { fetchApplicationStatusMap, isPersistableJobId } from "@/lib/job-applications";
import { fetchLiveJobById } from "@/lib/jobs/fetch-jobs";
import { getJobSeekerProfile } from "@/lib/user-profile-server";
import { normalizeOnboardingProfile, resolveSeekerLocation } from "@/lib/user-profile";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireRole("job_seeker");
  const profileRow = await getJobSeekerProfile(supabase, user.id);
  const profile = profileRow ? normalizeOnboardingProfile(profileRow) : null;
  const seekerLocation = resolveSeekerLocation(profile);
  const { job, source } = await fetchLiveJobById(id, seekerLocation);
  if (!job) notFound();

  const statuses = await fetchApplicationStatusMap(supabase, user.id, [job.id]);
  const applicationStatus = statuses[job.id] ?? null;

  return (
    <div>
      <Link href="/jobs" className="text-sm font-medium text-[#01696f]">
        ← Back to jobs
      </Link>
      {source === "supabase" ? (
        <p className="mt-2 text-xs text-[#437a22]">Live employer listing · AI-enriched</p>
      ) : null}
      <h1 className="mt-4 text-2xl font-bold">{job.title}</h1>
      <p className="text-[#7a7974]">
        {job.employer} · {job.location} · {job.payRange}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-[#437a22]/15 px-3 py-1 text-sm font-bold text-[#437a22]">
          {job.matchScore}% match
        </span>
        <FelonyRating rating={job.felonyFriendlyRating} />
        <AiBadge />
      </div>
      <Card className="mt-6">
        <p className="text-sm leading-relaxed">{job.aiSummary}</p>
        <p className="mt-4 text-sm whitespace-pre-wrap">{job.description}</p>
        <p className="mt-4 text-xs text-[#7a7974]">Source: {job.source}</p>
      </Card>
      <Disclaimer variant="legal" className="mt-4">
        <strong>Stay safe:</strong> Real employers will never ask you to pay a fee, buy
        equipment, or share your bank login, card number, or Social Security number before
        you&apos;ve had an interview and a written offer. If a listing asks for that, don&apos;t
        send anything.
      </Disclaimer>
      {source === "supabase" && isPersistableJobId(job.id) ? (
        <div className="mt-2">
          <ReportJobButton jobId={job.id} />
        </div>
      ) : null}
      <Card className="mt-4">
        <h2 className="font-semibold">Why this match?</h2>
        <ul className="mt-2 space-y-2 text-sm">
          <li>
            <strong>Matched skills:</strong> {job.matchReasons.matchedSkills.join(", ")}
          </li>
          <li>
            <strong>Possible concerns:</strong> {job.matchReasons.concerns.join(", ")}
          </li>
          <li>
            <strong>Transportation:</strong> {job.matchReasons.transportation}
          </li>
          <li>
            <strong>Background / license:</strong> {job.matchReasons.backgroundCheck}
          </li>
          <li>
            <strong>Recommended next step:</strong> {job.matchReasons.nextStep}
          </li>
        </ul>
      </Card>
      <div className="mt-6">
        <JobActions
          jobId={job.id}
          jobTitle={job.title}
          initialStatus={applicationStatus}
          liveJob={source === "supabase"}
          layout="detail"
        />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button href="/cover-letters" variant="secondary">
          Generate cover letter
        </Button>
        <Button href="/resume" variant="secondary">
          Generate resume bullets
        </Button>
        <Button href="/messages/compose" variant="secondary">
          Employer outreach message
        </Button>
        <Button href="/interview" variant="secondary">
          Practice interview
        </Button>
      </div>
    </div>
  );
}
