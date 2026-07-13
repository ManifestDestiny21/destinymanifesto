import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompanyProfile } from "@/lib/types";

export async function getCompanyProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<CompanyProfile | null> {
  const { data } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return (data as CompanyProfile | null) ?? null;
}

export function hasCompleteCompanyProfile(profile: CompanyProfile | null): boolean {
  return Boolean(profile?.company_name?.trim());
}
