import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { JobCard } from "@/components/job-card";
import { Card } from "@/components/ui/card";
import { fetchLiveJobs } from "@/lib/jobs/fetch-jobs";
import { DEMO_USER, MESSAGES, NEXT_STEPS } from "@/lib/mock-data";
import { requireRole } from "@/lib/auth/guards";
import { getJobSeekerProfile } from "@/lib/user-profile-server";
import { calculateProfileCompletion, displayName, normalizeOnboardingProfile, resolveSeekerLocation } from "@/lib/user-profile";
import { fetchApplicationStatusMap } from "@/lib/job-applications";

const ACTION_CARDS = [
  { label: "Find jobs", href: "/jobs", color: "bg-[#01696f]" },
  { label: "Build resume bullets", href: "/resume", color: "bg-[#01696f]/90" },
  { label: "Apply for SNAP", href: "/snap", color: "bg-[#437a22]" },
  { label: "Find housing", href: "/housing", color: "bg-[#437a22]/90" },
  { label: "Create this week's plan", href: "/coach", color: "bg-[#b8860b] text-[#28251d]" },
];

export default async function SeekerDashboardPage() {
  const { supabase, user } = await requireRole("job_seeker");

  const profileRow = await getJobSeekerProfile(supabase, user.id);
  const profile = profileRow ? normalizeOnboardingProfile(profileRow) : null;
  const seekerLocation = resolveSeekerLocation(profile);
  const name = displayName(profile);
  const completion = calculateProfileCompletion(profile);

  const { jobs, source } = await fetchLiveJobs(seekerLocation);
  const topJobs = jobs.slice(0, 2);
  const applicationStatuses = await fetchApplicationStatusMap(
    supabase,
    user.id,
    topJobs.map((job) => job.id)
  );

  return (
    <div>
      <PageHeader
        title={`Good morning, ${name}`}
        subtitle={`Next steps near ${seekerLocation.label}.`}
      />
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Profile completion</span>
          <span className="text-sm font-bold text-[#437a22]">{completion}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#7a7974]/20">
          <div
            className="h-full rounded-full bg-[#437a22]"
            style={{ width: `${completion}%` }}
          />
        </div>
        {!profile?.onboarding_completed ? (
          <p className="mt-2 text-xs text-[#7a7974]">
            <Link href="/onboarding" className="font-medium text-[#01696f] hover:underline">
              Continue onboarding
            </Link>{" "}
            for better job matches.
          </p>
        ) : (
          <p className="mt-2 text-xs text-[#7a7974]">
            Launch offer: Free access for the first 3 months · {DEMO_USER.trialDaysLeft} days left
          </p>
        )}
      </Card>
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#7a7974]">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ACTION_CARDS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`rounded-2xl px-3 py-4 text-center text-sm font-semibold text-white ${action.color}`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>
      <section className="mb-6">
        <h2 className="mb-3 font-semibold">Today&apos;s recommended next steps</h2>
        <ul className="space-y-2">
          {NEXT_STEPS.map((step) => (
            <li
              key={step}
              className="rounded-xl border border-[#7a7974]/10 bg-[#fbfbf9] px-3 py-2 text-sm"
            >
              {step}
            </li>
          ))}
        </ul>
      </section>
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Top job matches</h2>
          <Link href="/jobs" className="text-sm font-medium text-[#01696f]">
            View all
          </Link>
        </div>
        {source === "supabase" ? (
          <p className="mb-3 text-xs text-[#437a22]">Live matches from employer postings</p>
        ) : null}
        <div className="space-y-4">
          {topJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              applicationStatus={applicationStatuses[job.id] ?? null}
              liveJob={source === "supabase"}
            />
          ))}
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h3 className="font-semibold">Upcoming job fair</h3>
          <p className="mt-1 text-sm text-[#7a7974]">
            {seekerLocation.city} Reentry Hiring Fair — Jun 12
          </p>
          <Link href="/job-fairs" className="mt-2 inline-block text-sm font-medium text-[#01696f]">
            View details →
          </Link>
        </Card>
        <Card>
          <h3 className="font-semibold">Coaching check-in</h3>
          <p className="mt-1 text-sm text-[#7a7974]">Weekly goals due Sunday</p>
          <Link href="/coach" className="mt-2 inline-block text-sm font-medium text-[#01696f]">
            Open coach →
          </Link>
        </Card>
        <Card>
          <h3 className="font-semibold">SNAP reminder</h3>
          <p className="mt-1 text-sm text-[#7a7974]">Gather proof of income documents</p>
          <Link href="/snap" className="mt-2 inline-block text-sm font-medium text-[#01696f]">
            SNAP guide →
          </Link>
        </Card>
        <Card>
          <h3 className="font-semibold">Recent messages</h3>
          <p className="mt-1 text-sm text-[#7a7974]">{MESSAGES[0].preview}</p>
          <Link href="/messages" className="mt-2 inline-block text-sm font-medium text-[#01696f]">
            Open inbox →
          </Link>
        </Card>
      </div>
    </div>
  );
}
