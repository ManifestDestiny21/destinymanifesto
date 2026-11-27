import { NextResponse } from "next/server";
import { serverError } from "@/lib/api-errors";
import { requireApiRole } from "@/lib/auth/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { jobReportSchema, parseJsonBody } from "@/lib/validation";

/** A job seeker flags a listing as suspicious. Admins review it at /admin. */
export async function POST(request: Request) {
  const auth = await requireApiRole("job_seeker");
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;

  const limited = await enforceRateLimit(supabase, "job-reports:create");
  if (limited) return limited;

  const parsed = await parseJsonBody(request, jobReportSchema);
  if ("error" in parsed) return parsed.error;
  const { job_id, reason, details } = parsed.data;

  const { error } = await supabase.from("job_reports").insert({
    job_id,
    reporter_id: user.id,
    reason,
    details,
  });

  // 23505 = already reported by this user; treat as success.
  if (error && error.code !== "23505") {
    return serverError("report job", error, "Could not send your report. Please try again.");
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
