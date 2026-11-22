import { bootstrapJobSeekerProfile, getJobSeekerProfile } from "@/lib/user-profile-server";
import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import {
  buildDatabaseProfileUpdate,
  normalizeOnboardingProfile,
  type ProfileUpdatePayload,
} from "@/lib/user-profile";

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
    const message = err instanceof Error ? err.message : "Could not load profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedProfile();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;
  const body = await request.json();

  const signupData = {
    user_id: user.id,
    role: "job_seeker",
    first_name: body.first_name,
    last_name: body.last_name,
    about: body.about ?? null,
    date_of_birth: body.date_of_birth ?? null,
    phone: body.phone ?? null,
    phone_visible_to_employers: Boolean(body.phone_visible_to_employers),
    contact_consent: Boolean(body.contact_consent),
    street_address: body.street_address ?? null,
    city: body.city ?? null,
    county: body.county ?? null,
    state: body.state ?? null,
    zip_code: body.zip_code ?? null,
    resume_url: body.resume_url ?? null,
    heard_about_us: body.heard_about_us ?? null,
    preferred_name: body.preferred_name ?? null,
    search_radius_miles: body.search_radius_miles ?? null,
    onboarding_completed: Boolean(body.onboarding_completed),
    onboarding_data: body.profile_data ?? body.onboarding_data ?? { onboarding_step: 0 },
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
        onboarding_completed: Boolean(body.onboarding_completed),
        onboarding_data: body.profile_data ?? body.onboarding_data ?? { onboarding_step: 0 },
      },
      { onConflict: "user_id" }
    );
    if (minimalError) {
      return NextResponse.json({ error: minimalError.message || error.message }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const auth = await getAuthenticatedProfile();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;
  const body = (await request.json()) as ProfileUpdatePayload;

  let existingRow = await getJobSeekerProfile(supabase, user.id);

  if (!existingRow) {
    const bootstrapped = await bootstrapJobSeekerProfile(supabase, user.id);
    if (!bootstrapped.profile) {
      return NextResponse.json(
        { error: bootstrapped.error ?? "Profile not found" },
        { status: 404 }
      );
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
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const row = data?.[0] as Record<string, unknown> | undefined;
  if (!row) {
    return NextResponse.json({ error: "Profile update did not return a row" }, { status: 400 });
  }

  return NextResponse.json({
    profile: normalizeOnboardingProfile(row),
  });
}
