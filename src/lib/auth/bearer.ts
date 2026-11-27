import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

/** Constant-time check that `header` is exactly `Bearer <secret>`. */
export function isBearerAuthorized(header: string | null, secret: string): boolean {
  if (!header) return false;
  // Hash both sides so lengths match and comparison is constant-time.
  const given = createHash("sha256").update(header).digest();
  const expected = createHash("sha256").update(`Bearer ${secret}`).digest();
  return timingSafeEqual(given, expected);
}
