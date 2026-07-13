import { bootstrapJobSeekerProfile } from "@/lib/user-profile-server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildDatabaseProfileUpdate, normalizeOnboardingProfile, type ProfileUpdatePayload } from "@/lib/user-profile";

async function getAuthenticatedProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { supabase, user };
}

export async function GET() {
  const auth = await getAuthenticatedProfile();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    profile: data ? normalizeOnboardingProfile(data as Record<string, unknown>) : null,
  });
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
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const auth = await getAuthenticatedProfile();
  if ("error" in auth) return auth.error;

  const { supabase, user } = auth;
  const body = (await request.json()) as ProfileUpdatePayload;

  const existingResult = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingResult.error) {
    return NextResponse.json({ error: existingResult.error.message }, { status: 400 });
  }

  let existingRow = existingResult.data as Record<string, unknown> | null;

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

  const { data, error } = await supabase
    .from("user_profiles")
    .update(update)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    profile: normalizeOnboardingProfile(data as Record<string, unknown>),
  });
}
