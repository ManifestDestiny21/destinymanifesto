import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApplicationStatus, Job } from "@/lib/types";
import { fetchLiveJobs } from "@/lib/jobs/fetch-jobs";

export type JobApplicationRow = {
  id: string;
  user_id: string;
  job_id: string;
  status: ApplicationStatus;
  note: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPersistableJobId(jobId: string): boolean {
  return UUID_RE.test(jobId);
}

export async function fetchApplicationStatusMap(
  supabase: SupabaseClient,
  userId: string,
  jobIds: string[]
): Promise<Record<string, ApplicationStatus>> {
  const persistableIds = jobIds.filter(isPersistableJobId);
  if (!persistableIds.length) return {};

  const { data } = await supabase
    .from("job_applications")
    .select("job_id, status")
    .eq("user_id", userId)
    .in("job_id", persistableIds);

  const map: Record<string, ApplicationStatus> = {};
  for (const row of data ?? []) {
    map[row.job_id] = row.status as ApplicationStatus;
  }
  return map;
}

export async function fetchSavedJobsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<Array<{ application: JobApplicationRow; job: Job }>> {
  const { data: applications, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !applications?.length) {
    return [];
  }

  const { jobs: liveJobs } = await fetchLiveJobs();
  const jobById = new Map(liveJobs.map((job) => [job.id, job]));

  return (applications as JobApplicationRow[])
    .map((application) => {
      const job = jobById.get(application.job_id);
      if (!job) return null;
      return { application, job };
    })
    .filter((entry): entry is { application: JobApplicationRow; job: Job } => entry !== null);
}

export function formatAppliedDate(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
