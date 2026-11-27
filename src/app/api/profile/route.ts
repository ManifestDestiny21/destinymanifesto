import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { serverError } from "@/lib/api-errors";
import { companyProfileSchema, parseJsonBody } from "@/lib/validation";

export async function POST(request: Request) {
  const auth = await requireApiRole("employer");
  if ("error" in auth) return auth.error;
  const { supabase, user } = auth;
  const limited = await enforceRateLimit(supabase, "company-profile:save");
  if (limited) return limited;

  const parsed = await parseJsonBody(request, companyProfileSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  const { error } = await supabase.from("company_profiles").upsert(
    {
      user_id: user.id,
      company_name: body.company_name,
      website: body.website,
      location: body.location,
      description: body.description,
      felon_friendly: body.felon_friendly,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return serverError("save company profile", error, "Could not save your company profile.");
  }

  return NextResponse.json({ success: true });
}
