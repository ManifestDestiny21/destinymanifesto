import { NextResponse } from "next/server";
import { enrichAndSaveJob } from "@/lib/jobs/persist-enrichment";
import { getCompanyProfile, hasCompleteCompanyProfile } from "@/lib/employer/company-profile";
import { requireApiRole } from "@/lib/auth/api";
import type { createClient } from "@/lib/supabase/server";

type JobBody = {
  title?: string;
  location?: string;
  salaryRange?: string;
  description?: string;
  felonFriendly?: boolean;
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
    return { error: NextResponse.json({ error: error.message }, { status: 400 }) };
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
  body: Required<Pick<JobBody, "title" | "location" | "description" | "felonFriendly">> & {
    salaryRange?: string;
  }
) {
  const company = await getCompanyProfile(supabase, userId);

  return enrichAndSaveJob(jobId, {
    title: body.title,
    location: body.location,
    salary_range: body.salaryRange || null,
    description: body.description,
    felon_friendly: Boolean(body.felonFriendly),
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
  const body = (await request.json()) as JobBody;

  if (!body.title?.trim() || !body.location?.trim() || !body.description?.trim()) {
    return NextResponse.json({ error: "Title, location, and description are required." }, { status: 400 });
  }

  const { error } = await supabase
    .from("jobs")
    .update({
      title: body.title.trim(),
      location: body.location.trim(),
      salary_range: body.salaryRange?.trim() || null,
      description: body.description.trim(),
      felon_friendly: Boolean(body.felonFriendly),
    })
    .eq("id", job.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const enrichResult = await enrichJobListing(supabase, user.id, job.id, {
    title: body.title.trim(),
    location: body.location.trim(),
    salaryRange: body.salaryRange,
    description: body.description.trim(),
    felonFriendly: Boolean(body.felonFriendly),
  });

  if (!enrichResult.ok) {
    return NextResponse.json({
      success: true,
      warning: `Job updated but AI enrichment failed: ${enrichResult.error}`,
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

  const { error } = await supabase.from("jobs").delete().eq("id", job.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
