import { NextResponse } from "next/server";
import { isBearerAuthorized } from "@/lib/auth/bearer";
import { enrichAndSaveJob } from "@/lib/jobs/persist-enrichment";
import { createAdminClient } from "@/lib/supabase/admin";

/** Backfill AI fields for jobs missing ai_summary. Requires SUPABASE_SERVICE_ROLE_KEY and JOB_ENRICH_SECRET. */
export async function POST(request: Request) {
  // Fail closed: if no secret is configured, the endpoint is disabled.
  const secret = process.env.JOB_ENRICH_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!isBearerAuthorized(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 },
    );
  }

  const { data: jobs, error } = await admin
    .from("jobs")
    .select(
      "id, title, location, salary_range, description, felon_friendly, employer_id, ai_summary",
    )
    .is("ai_summary", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const job of jobs ?? []) {
    const { data: company } = await admin
      .from("company_profiles")
      .select("company_name, felon_friendly")
      .eq("user_id", job.employer_id)
      .maybeSingle();

    const result = await enrichAndSaveJob(job.id, {
      title: job.title,
      location: job.location,
      salary_range: job.salary_range,
      description: job.description,
      felon_friendly: job.felon_friendly,
      company_name: company?.company_name ?? null,
      company_felon_friendly: company?.felon_friendly ?? false,
    });

    results.push({ id: job.id, ok: result.ok, error: result.ok ? undefined : result.error });
  }

  return NextResponse.json({
    processed: results.length,
    succeeded: results.filter((r) => r.ok).length,
    results,
  });
}
