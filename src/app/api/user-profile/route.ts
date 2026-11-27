import { bootstrapJobSeekerProfile, getJobSeekerProfile } from "@/lib/user-profile-server";
import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { serverError } from "@/lib/api-errors";
import {
  isOwnResumePath,
  parseJsonBody,
  userProfileCreateSchema,
  userProfilePatchSchema,
} from "@/lib/validation";
import {
  buildDatabaseProfileUpdate,
  normalizeOnboardingProfile,
} from "@/lib/user-profile";
import type { OnboardingProfileData } from "@/lib/types";

function getAuthenticatedProfile() {
  return requireApiRole("job_seeker");
}

export async function GET() {
  const auth = await getAuthenticatedProfile();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;
  try {
    const data = await getJobSeekerProfile(supabase, user.id);
    return NextResponse.json({
      profile: data ? normalizeOnboardingProfile(data) : null,
    });
  } catch (err: unknown) {
    return serverError("load profile", err, "Could not load your profile.");
  }
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedProfile();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;
  const limited = await enforceRateLimit(supabase, "user-profile:create");
  if (limited) return limited;
  const parsed = await parseJsonBody(request, userProfileCreateSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  // Only accept a resume stored in the caller's own private folder.
  const resumePath =
    body.resume_url && isOwnResumePath(body.resume_url, user.id) ? body.resume_url : null;
  const onboardingData = body.profile_data ?? body.onboarding_data ?? { onboarding_step: 0 };

  const signupData = {
    user_id: user.id,
    role: "job_seeker",
    first_name: body.first_name,
    last_name: body.last_name,
    about: body.about,
    date_of_birth: body.date_of_birth,
    phone: body.phone,
    phone_visible_to_employers: body.phone_visible_to_employers,
    contact_consent: body.contact_consent,
    street_address: body.street_address,
    city: body.city,
    county: body.county,
    state: body.state,
    zip_code: body.zip_code,
    resume_url: resumePath,
    heard_about_us: body.heard_about_us,
    preferred_name: body.preferred_name,
    search_radius_miles: body.search_radius_miles,
    onboarding_completed: body.onboarding_completed,
    onboarding_data: onboardingData,
  };

  const { error } = await supabase
    .from("user_profiles")
    .upsert(signupData, { onConflict: "user_id" });

  if (error) {
    // Minimal fallback if older required columns are absent
    const { error: minimalError } = await supabase.from("user_profiles").upsert(
      {
        user_id: user.id,
        role: "job_seeker",
        onboarding_completed: body.onboarding_completed,
        onboarding_data: onboardingData,
      },
      { onConflict: "user_id" }
    );
    if (minimalError) {
      console.error("[api] save profile (full):", error.message);
      return serverError("save profile", minimalError, "Could not save your profile.");
    }
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const auth = await getAuthenticatedProfile();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;
  const limited = await enforceRateLimit(supabase, "user-profile:update");
  if (limited) return limited;
  const parsed = await parseJsonBody(request, userProfilePatchSchema);
  if ("error" in parsed) return parsed.error;
  const body = { ...parsed.data, profile_data: parsed.data.profile_data as OnboardingProfileData | null | undefined };

  let existingRow = await getJobSeekerProfile(supabase, user.id);

  if (!existingRow) {
    const bootstrapped = await bootstrapJobSeekerProfile(supabase, user.id);
    if (!bootstrapped.profile) {
      return serverError("bootstrap profile", bootstrapped.error, "Profile not found", 404);
    }
    existingRow = bootstrapped.profile;
  }

  const update = buildDatabaseProfileUpdate(existingRow, body);
  const profileId = existingRow.id as string | undefined;

  let query = supabase.from("user_profiles").update(update).eq("user_id", user.id);
  if (profileId) {
    query = query.eq("id", profileId);
  }

  const { data, error } = await query.select("*").limit(1);

  if (error) {
    return serverError("update profile", error, "Could not save your changes.");
  }

  const row = data?.[0] as Record<string, unknown> | undefined;
  if (!row) {
    return serverError("update profile", "no row returned", "Could not save your changes.");
  }

  return NextResponse.json({
    profile: normalizeOnboardingProfile(row),
  });
}
