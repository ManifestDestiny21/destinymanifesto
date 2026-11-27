import { NextResponse } from "next/server";
import { enrichAndSaveJob } from "@/lib/jobs/persist-enrichment";
import { getCompanyProfile } from "@/lib/employer/company-profile";
import { requireApiRole } from "@/lib/auth/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { serverError } from "@/lib/api-errors";
import { jobSchema, parseJsonBody } from "@/lib/validation";
import type { createClient } from "@/lib/supabase/server";

type JobBody = {
  title: string;
  location: string;
  salaryRange: string | null;
  description: string;
  felonFriendly: boolean;
};

async function getOwnedJob(jobId: string) {
  const auth = await requireApiRole("employer");
  if ("error" in auth) return auth;
  const { supabase, user } = auth;

  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("employer_id", user.id)
    .maybeSingle();

  if (error) {
    return { error: serverError("load job", error) };
  }

  if (!job) {
    return { error: NextResponse.json({ error: "Job not found" }, { status: 404 }) };
  }

  return { supabase, user, job };
}

async function enrichJobListing(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  jobId: string,
  body: JobBody
) {
  const company = await getCompanyProfile(supabase, userId);

  return enrichAndSaveJob(jobId, {
    title: body.title,
    location: body.location,
    salary_range: body.salaryRange,
    description: body.description,
    felon_friendly: body.felonFriendly,
    company_name: company?.company_name ?? null,
    company_felon_friendly: company?.felon_friendly ?? false,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await getOwnedJob(id);
  if ("error" in result) return result.error;

  const { supabase, user, job } = result;
  const limited = await enforceRateLimit(supabase, "jobs:update");
  if (limited) return limited;
  const parsed = await parseJsonBody(request, jobSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  const { error } = await supabase
    .from("jobs")
    .update({
      title: body.title,
      location: body.location,
      salary_range: body.salaryRange,
      description: body.description,
      felon_friendly: body.felonFriendly,
    })
    .eq("id", job.id);

  if (error) {
    return serverError("update job", error, "Could not update the job. Please try again.");
  }

  const enrichResult = await enrichJobListing(supabase, user.id, job.id, body);

  if (!enrichResult.ok) {
    console.error("[api] enrich updated job:", enrichResult.error);
    return NextResponse.json({
      success: true,
      warning: "Job updated, but the AI summary couldn't be refreshed yet.",
    });
  }

  return NextResponse.json({ success: true, aiEnriched: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await getOwnedJob(id);
  if ("error" in result) return result.error;

  const { supabase, job } = result;
  const limited = await enforceRateLimit(supabase, "jobs:delete");
  if (limited) return limited;

  const { error } = await supabase.from("jobs").delete().eq("id", job.id);

  if (error) {
    return serverError("delete job", error, "Could not delete the job. Please try again.");
  }

  return NextResponse.json({ success: true });
}
