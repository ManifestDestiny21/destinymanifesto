import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHomePath, getUserRole } from "@/lib/auth/roles";

/**
 * Only allow same-site relative paths like "/dashboard". Rejects absolute URLs,
 * protocol-relative "//evil.com", backslash tricks, and "@host" / ".host" suffixes
 * that would otherwise turn `${origin}${next}` into an off-site redirect.
 */
function safeRedirectPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return null;
  }
  if (/[\\\u0000-\u001f]/.test(next)) return null;
  try {
    const base = "https://placeholder.invalid";
    const url = new URL(next, base);
    if (url.origin !== base) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data.user) {
      const role = getUserRole(data.user);
      const destination = next ?? (role ? getHomePath(role) : "/");
      return NextResponse.redirect(new URL(destination, origin));
    }
  }

  return NextResponse.redirect(new URL(next ?? "/", origin));
}
