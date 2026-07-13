import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

function getServiceRoleKey(): string | undefined {
  const raw = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!raw) return undefined;
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, "");
  if ([...trimmed].some((char) => char.charCodeAt(0) > 255)) {
    return undefined;
  }
  return trimmed;
}

export function createAdminClient(): SupabaseClient | null {
  const serviceKey = getServiceRoleKey();
  if (!serviceKey) return null;

  try {
    const { url } = getSupabaseEnv();
    return createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch {
    return null;
  }
}
