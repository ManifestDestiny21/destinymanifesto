"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const uuid = z.string().uuid();

/** Every action re-checks the caller; server actions are reachable by direct POST. */
async function adminClientForCaller() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user)) {
    throw new Error("Not authorized");
  }
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return admin;
}

function fail(context: string, error: { message: string } | null) {
  if (error) {
    console.error(`[admin] ${context}:`, error.message);
    throw new Error(`Could not ${context}`);
  }
}

export async function setEmployerStatus(formData: FormData) {
  const admin = await adminClientForCaller();
  const userId = uuid.parse(formData.get("userId"));
  const status = z.enum(["approved", "rejected", "pending"]).parse(formData.get("status"));

  const { error } = await admin
    .from("company_profiles")
    .update({ approval_status: status, reviewed_at: new Date().toISOString() })
    .eq("user_id", userId);
  fail("update employer", error);

  revalidatePath("/admin");
}

export async function setJobHidden(formData: FormData) {
  const admin = await adminClientForCaller();
  const jobId = uuid.parse(formData.get("jobId"));
  const hidden = formData.get("hidden") === "true";
  const reason = z.string().trim().max(200).optional().parse(formData.get("reason") ?? undefined);

  const { error } = await admin
    .from("jobs")
    .update({ hidden, hidden_reason: hidden ? reason || "Hidden by an admin" : null })
    .eq("id", jobId);
  fail("update job", error);

  if (hidden) {
    const { error: reportError } = await admin
      .from("job_reports")
      .update({ status: "resolved", reviewed_at: new Date().toISOString() })
      .eq("job_id", jobId)
      .eq("status", "open");
    fail("resolve reports", reportError);
  }

  revalidatePath("/admin");
}

export async function dismissJobReports(formData: FormData) {
  const admin = await adminClientForCaller();
  const jobId = uuid.parse(formData.get("jobId"));

  const { error } = await admin
    .from("job_reports")
    .update({ status: "dismissed", reviewed_at: new Date().toISOString() })
    .eq("job_id", jobId)
    .eq("status", "open");
  fail("dismiss reports", error);

  revalidatePath("/admin");
}
