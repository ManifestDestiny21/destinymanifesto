import { jobsForSeeker } from "@/lib/local-content";
import type { DbJobRow } from "@/lib/jobs/db-types";
import { mapDbJobToDisplay } from "@/lib/jobs/map-to-display";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Job } from "@/lib/types";
import {
  locationMatchesMarket,
  type SeekerLocation,
} from "@/lib/user-profile";

type JobRow = Omit<DbJobRow, "company_profiles">;

function demoJobsForLocation(seekerLocation?: SeekerLocation | null): Job[] {
  if (!seekerLocation) {
    return jobsForSeeker({
      city: "Nashville",
      state: "TN",
      zip: "37203",
      label: "Nashville, TN",
    });
  }
  return jobsForSeeker(seekerLocation);
}

export async function fetchLiveJobs(seekerLocation?: SeekerLocation | null): Promise<{
  jobs: Job[];
  source: "supabase" | "mock";
}> {
  const admin = createAdminClient();
  if (!admin) {
    return { jobs: demoJobsForLocation(seekerLocation), source: "mock" };
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
    return { jobs: demoJobsForLocation(seekerLocation), source: "mock" };
  }

  if (!jobRows?.length) {
    return { jobs: demoJobsForLocation(seekerLocation), source: "mock" };
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
    const local = mapped.filter((job) =>
      locationMatchesMarket(job.location, seekerLocation)
    );
    if (local.length > 0) {
      return { jobs: local, source: "supabase" };
    }
    // Live jobs exist elsewhere — show demo content for this seeker's city
    return { jobs: demoJobsForLocation(seekerLocation), source: "mock" };
  }

  return { jobs: mapped, source: "supabase" };
}

export async function fetchLiveJobById(
  id: string,
  seekerLocation?: SeekerLocation | null
): Promise<{
  job: Job | null;
  source: "supabase" | "mock";
}> {
  if (seekerLocation) {
    const local = await fetchLiveJobs(seekerLocation);
    const match = local.jobs.find((j) => j.id === id);
    if (match) return { job: match, source: local.source };
  }

  const admin = createAdminClient();
  if (admin) {
    const { data: row } = await admin
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
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (row) {
      const { data: company } = await admin
        .from("company_profiles")
        .select("user_id, company_name, felon_friendly")
        .eq("user_id", row.employer_id)
        .maybeSingle();
      return {
        job: mapDbJobToDisplay(
          { ...(row as JobRow), company_profiles: company ?? null },
          company ?? null
        ),
        source: "supabase",
      };
    }
  }

  const { JOBS } = await import("@/lib/mock-data");
  const mock = JOBS.find((j) => j.id === id) ?? null;
  return { job: mock, source: "mock" };
}
