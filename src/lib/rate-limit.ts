import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/** Per-user limits per action: `limit` requests per `windowSeconds`. */
export const RATE_LIMITS = {
  "jobs:create": { limit: 20, windowSeconds: 3600 },
  "jobs:update": { limit: 60, windowSeconds: 3600 },
  "jobs:delete": { limit: 60, windowSeconds: 3600 },
  "company-profile:save": { limit: 30, windowSeconds: 3600 },
  "user-profile:create": { limit: 10, windowSeconds: 3600 },
  "user-profile:update": { limit: 240, windowSeconds: 3600 },
  "job-applications:write": { limit: 120, windowSeconds: 3600 },
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;

/**
 * Returns a 429 response if the signed-in user is over the limit for `action`,
 * otherwise null. Counters live in Postgres (see supabase/rate-limits.sql), so
 * limits hold across serverless instances.
 *
 * Fails open: if the limiter itself errors (e.g. migration not applied yet), the
 * request is allowed and the problem is logged, so a limiter fault can't take the
 * whole app down.
 */
export async function enforceRateLimit(
  supabase: SupabaseClient,
  action: RateLimitAction
): Promise<NextResponse | null> {
  const { limit, windowSeconds } = RATE_LIMITS[action];

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_action: action,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.error(`[rate-limit] ${action}: limiter unavailable:`, error.message);
    return null;
  }

  if (data === false) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a bit and try again." },
      { status: 429, headers: { "Retry-After": String(windowSeconds) } }
    );
  }

  return null;
}
