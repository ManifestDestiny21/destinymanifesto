import { JobsBoard } from "@/components/jobs-board";
import { PageHeader } from "@/components/page-header";
import { requireRole } from "@/lib/auth/guards";
import { getJobSeekerProfile } from "@/lib/user-profile-server";
import { fetchApplicationStatusMap } from "@/lib/job-applications";
import { fetchLiveJobs } from "@/lib/jobs/fetch-jobs";
import { normalizeOnboardingProfile, resolveSeekerLocation } from "@/lib/user-profile";

export default async function JobsPage() {
  const { supabase, user } = await requireRole("job_seeker");
  const profileRow = await getJobSeekerProfile(supabase, user.id);
  const profile = profileRow ? normalizeOnboardingProfile(profileRow) : null;
  const seekerLocation = resolveSeekerLocation(profile);

  const { jobs, source } = await fetchLiveJobs(seekerLocation);
  const applicationStatuses = await fetchApplicationStatusMap(
    supabase,
    user.id,
    jobs.map((job) => job.id)
  );

  return (
    <div>
      <PageHeader
        title="Job board"
        subtitle={`Jobs and support near ${seekerLocation.label}.`}
      />
      <JobsBoard
        jobs={jobs}
        dataSource={source}
        applicationStatuses={applicationStatuses}
        seekerLocationLabel={seekerLocation.label}
      />
    </div>
  );
}
