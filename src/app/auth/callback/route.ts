import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getHomePath, resolveUserRole } from "@/lib/auth/roles";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    if (data.user) {
      const role = await resolveUserRole(supabase, data.user);
      const destination = next ?? (role ? getHomePath(role) : "/");
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}${next ?? "/"}`);
}
