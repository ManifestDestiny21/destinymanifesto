import { JOBS as MOCK_JOBS } from "@/lib/mock-data";
import type { DbJobRow } from "@/lib/jobs/db-types";
import { mapDbJobToDisplay } from "@/lib/jobs/map-to-display";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Job } from "@/lib/types";
import {
  prioritizeJobsForLocation,
  type SeekerLocation,
} from "@/lib/user-profile";

type JobRow = Omit<DbJobRow, "company_profiles">;

function withLocalFallback(
  jobs: Job[],
  seekerLocation?: SeekerLocation | null
): Job[] {
  if (!seekerLocation) return jobs;
  return prioritizeJobsForLocation(jobs, seekerLocation);
}

export async function fetchLiveJobs(seekerLocation?: SeekerLocation | null): Promise<{
  jobs: Job[];
  source: "supabase" | "mock";
}> {
  const admin = createAdminClient();
  if (!admin) {
    return { jobs: withLocalFallback(MOCK_JOBS, seekerLocation), source: "mock" };
  }

  const { data: jobRows, error } = await admin
    .from("jobs")
    .select(
      `
      id,
      employer_id,
      title,
      location,
      salary_range,
      description,
      felon_friendly,
      employment_type,
      schedule,
      job_category,
      required_skills,
      preferred_skills,
      ai_summary,
      ai_tags,
      felony_friendly_rating,
      ai_enriched_at,
      created_at
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    return { jobs: withLocalFallback(MOCK_JOBS, seekerLocation), source: "mock" };
  }

  if (!jobRows?.length) {
    return { jobs: withLocalFallback(MOCK_JOBS, seekerLocation), source: "mock" };
  }

  const employerIds = [...new Set(jobRows.map((j) => j.employer_id))];
  const { data: companies } = await admin
    .from("company_profiles")
    .select("user_id, company_name, felon_friendly")
    .in("user_id", employerIds);

  const companyByUser = new Map(
    (companies ?? []).map((c) => [
      c.user_id,
      { company_name: c.company_name, felon_friendly: c.felon_friendly },
    ]),
  );

  const mapped = (jobRows as JobRow[]).map((row) =>
    mapDbJobToDisplay(
      { ...row, company_profiles: companyByUser.get(row.employer_id) ?? null },
      companyByUser.get(row.employer_id) ?? null,
    ),
  );

  if (seekerLocation) {
    const local = mapped.filter(
      (job) =>
        job.location.toLowerCase().includes(seekerLocation.state.toLowerCase()) ||
        job.location.toLowerCase().includes(seekerLocation.city.toLowerCase())
    );
    if (local.length > 0) {
      return { jobs: local, source: "supabase" };
    }
    // Live jobs exist elsewhere — show local demo market so seeker still sees TN options
    return { jobs: withLocalFallback(MOCK_JOBS, seekerLocation), source: "mock" };
  }

  return { jobs: mapped, source: "supabase" };
}

export async function fetchLiveJobById(id: string): Promise<{
  job: Job | null;
  source: "supabase" | "mock";
}> {
  const { jobs, source } = await fetchLiveJobs();
  const job = jobs.find((j) => j.id === id) ?? null;
  return { job, source };
}
