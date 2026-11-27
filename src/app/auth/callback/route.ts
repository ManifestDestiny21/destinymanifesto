import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHomePath, getUserRole } from "@/lib/auth/roles";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

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
