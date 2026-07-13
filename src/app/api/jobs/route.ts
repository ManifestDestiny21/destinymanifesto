import { NextResponse } from "next/server";
import { enrichAndSaveJob } from "@/lib/jobs/persist-enrichment";
import { getCompanyProfile, hasCompleteCompanyProfile } from "@/lib/employer/company-profile";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const company = await getCompanyProfile(supabase, user.id);
  if (!hasCompleteCompanyProfile(company)) {
    return NextResponse.json(
      { error: "Complete your company profile before posting a job." },
      { status: 400 }
    );
  }

  const body = await request.json();

  const { data: inserted, error } = await supabase
    .from("jobs")
    .insert({
      employer_id: user.id,
      title: body.title,
      location: body.location,
      salary_range: body.salaryRange || null,
      description: body.description,
      felon_friendly: body.felonFriendly,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return NextResponse.json({ error: error?.message ?? "Failed to create job" }, { status: 400 });
  }

  const enrichResult = await enrichAndSaveJob(inserted.id, {
    title: body.title,
    location: body.location,
    salary_range: body.salaryRange || null,
    description: body.description,
    felon_friendly: Boolean(body.felonFriendly),
    company_name: company?.company_name ?? null,
    company_felon_friendly: company?.felon_friendly ?? false,
  });

  if (!enrichResult.ok) {
    return NextResponse.json(
      { success: true, warning: `Job posted but AI enrichment failed: ${enrichResult.error}` },
      { status: 201 },
    );
  }

  return NextResponse.json({ success: true, aiEnriched: true }, { status: 201 });
}
