import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchSavedJobsForUser, isPersistableJobId } from "@/lib/job-applications";
import type { ApplicationStatus } from "@/lib/types";

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { supabase, user };
}

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;
  const { searchParams } = new URL(request.url);
  const jobIdsParam = searchParams.get("job_ids");

  if (jobIdsParam) {
    const jobIds = jobIdsParam.split(",").filter(Boolean);
    const persistableIds = jobIds.filter(isPersistableJobId);

    if (!persistableIds.length) {
      return NextResponse.json({ statuses: {} });
    }

    const { data, error } = await supabase
      .from("job_applications")
      .select("job_id, status")
      .eq("user_id", user.id)
      .in("job_id", persistableIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const statuses: Record<string, ApplicationStatus> = {};
    for (const row of data ?? []) {
      statuses[row.job_id] = row.status as ApplicationStatus;
    }

    return NextResponse.json({ statuses });
  }

  const entries = await fetchSavedJobsForUser(supabase, user.id);
  return NextResponse.json({
    applications: entries.map(({ application, job }) => ({
      ...application,
      job,
    })),
  });
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;
  const body = await request.json();
  const jobId = body.job_id as string | undefined;
  const action = body.action as "save" | "apply" | undefined;
  const note = (body.note as string | undefined)?.trim() || null;

  if (!jobId || !isPersistableJobId(jobId)) {
    return NextResponse.json(
      { error: "This job cannot be saved or applied to yet. Try a live employer listing." },
      { status: 400 }
    );
  }

  if (action !== "save" && action !== "apply") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", jobId)
    .maybeSingle();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", user.id)
    .eq("job_id", jobId)
    .maybeSingle();

  if (action === "save") {
    if (existing) {
      return NextResponse.json({
        application: existing,
        status: existing.status as ApplicationStatus,
      });
    }

    const { data, error } = await supabase
      .from("job_applications")
      .insert({
        user_id: user.id,
        job_id: jobId,
        status: "saved",
        updated_at: now,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ application: data, status: "saved" as ApplicationStatus });
  }

  const payload = {
    user_id: user.id,
    job_id: jobId,
    status: "applied" as const,
    note,
    applied_at: existing?.applied_at ?? now,
    updated_at: now,
  };

  const { data, error } = existing
    ? await supabase
        .from("job_applications")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single()
    : await supabase.from("job_applications").insert(payload).select("*").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ application: data, status: "applied" as ApplicationStatus });
}

export async function DELETE(request: Request) {
  const auth = await getAuthenticatedUser();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("job_id");

  if (!jobId || !isPersistableJobId(jobId)) {
    return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("job_applications")
    .select("status")
    .eq("user_id", user.id)
    .eq("job_id", jobId)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ success: true });
  }

  if (existing.status !== "saved") {
    return NextResponse.json(
      { error: "Only saved jobs can be removed. Applied jobs stay in your tracker." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("job_applications")
    .delete()
    .eq("user_id", user.id)
    .eq("job_id", jobId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
