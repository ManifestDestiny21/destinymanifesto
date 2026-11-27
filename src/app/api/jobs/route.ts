import { NextResponse } from "next/server";
import { enrichAndSaveJob } from "@/lib/jobs/persist-enrichment";
import { getCompanyProfile, hasCompleteCompanyProfile } from "@/lib/employer/company-profile";
import { requireApiRole } from "@/lib/auth/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { serverError } from "@/lib/api-errors";
import { jobSchema, parseJsonBody } from "@/lib/validation";

export async function POST(request: Request) {
  const auth = await requireApiRole("employer");
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const limited = await enforceRateLimit(supabase, "jobs:create");
  if (limited) return limited;

  const company = await getCompanyProfile(supabase, user.id);
  if (!hasCompleteCompanyProfile(company)) {
    return NextResponse.json(
      { error: "Complete your company profile before posting a job." },
      { status: 400 }
    );
  }

  const parsed = await parseJsonBody(request, jobSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  const { data: inserted, error } = await supabase
    .from("jobs")
    .insert({
      employer_id: user.id,
      title: body.title,
      location: body.location,
      salary_range: body.salaryRange,
      description: body.description,
      felon_friendly: body.felonFriendly,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return serverError("create job", error, "Could not create the job. Please try again.");
  }

  const enrichResult = await enrichAndSaveJob(inserted.id, {
    title: body.title,
    location: body.location,
    salary_range: body.salaryRange,
    description: body.description,
    felon_friendly: body.felonFriendly,
    company_name: company?.company_name ?? null,
    company_felon_friendly: company?.felon_friendly ?? false,
  });

  if (!enrichResult.ok) {
    console.error("[api] enrich new job:", enrichResult.error);
    return NextResponse.json(
      { success: true, warning: "Job posted, but the AI summary couldn't be generated yet." },
      { status: 201 },
    );
  }

  return NextResponse.json({ success: true, aiEnriched: true }, { status: 201 });
}
