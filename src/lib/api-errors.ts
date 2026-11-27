import "server-only";

import { NextResponse } from "next/server";

/**
 * Log the real error on the server and return a generic message to the client,
 * so database/schema details never reach the browser.
 */
export function serverError(
  context: string,
  error: unknown,
  message = "Something went wrong. Please try again.",
  status = 400
): NextResponse {
  const detail = error instanceof Error ? error.message : (error as { message?: string })?.message;
  console.error(`[api] ${context}:`, detail ?? error);
  return NextResponse.json({ error: message }, { status });
}
