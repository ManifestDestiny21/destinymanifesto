import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { newJobSeekerProfileRow } from "@/lib/user-profile";

export async function getJobSeekerProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Record<string, unknown> | null> {
  // Use limit(1) so duplicate rows (missing unique constraint) don't crash maybeSingle()
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return (data?.[0] as Record<string, unknown> | undefined) ?? null;
}

export async function bootstrapJobSeekerProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<{ profile: Record<string, unknown> | null; error?: string }> {
  const existing = await getJobSeekerProfile(supabase, userId);
  if (existing) {
    return { profile: existing };
  }

  const row = newJobSeekerProfileRow(userId);
  const attempts: string[] = [];

  const { error: rpcError } = await supabase.rpc("bootstrap_user_profile");
  if (!rpcError) {
    const profile = await getJobSeekerProfile(supabase, userId);
    if (profile) return { profile };
  }
  if (rpcError?.message) attempts.push(rpcError.message);

  const { error: insertError } = await supabase.from("user_profiles").insert(row);
  if (!insertError) {
    const profile = await getJobSeekerProfile(supabase, userId);
    if (profile) return { profile };
  }
  if (insertError?.message) attempts.push(insertError.message);

  const admin = createAdminClient();
  if (admin) {
    const { error: adminError } = await admin.from("user_profiles").insert(row);
    if (!adminError) {
      const profile = await getJobSeekerProfile(supabase, userId);
      if (profile) return { profile };
    }
    if (adminError?.message) attempts.push(adminError.message);
  }

  return {
    profile: null,
    error:
      attempts.join(" | ") ||
      "Could not create your profile row. Run supabase/fix-onboarding.sql in Supabase SQL Editor.",
  };
}
