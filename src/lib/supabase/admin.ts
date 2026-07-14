import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

function getServiceRoleKey(): string | undefined {
  const raw = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!raw) return undefined;
  const cleaned = [...raw.trim()]
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code <= 126;
    })
    .join("")
    .replace(/^['"]|['"]$/g, "");
  return cleaned || undefined;
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
