import { createAdminClient } from "@/lib/supabase/admin";
import { enrichJob, type JobEnrichmentInput } from "@/lib/jobs/enrich";

export async function enrichAndSaveJob(
  jobId: string,
  input: JobEnrichmentInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const enrichment = await enrichJob(input);
  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY for enrichment." };
  }

  const { error } = await admin
    .from("jobs")
    .update({
      ai_summary: enrichment.ai_summary,
      ai_tags: enrichment.ai_tags,
      felony_friendly_rating: enrichment.felony_friendly_rating,
      employment_type: enrichment.employment_type,
      schedule: enrichment.schedule,
      job_category: enrichment.job_category,
      required_skills: enrichment.required_skills,
      preferred_skills: enrichment.preferred_skills,
      ai_enriched_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
