import "server-only";

import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, type UserRole } from "@/lib/auth/roles";

type ApiAuthResult =
  | { error: NextResponse }
  | {
      supabase: Awaited<ReturnType<typeof createClient>>;
      user: User;
      role: UserRole;
    };

/** Authenticate an API request and require the caller to hold `expected` role. */
export async function requireApiRole(expected: UserRole): Promise<ApiAuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const role = getUserRole(user);
  if (role !== expected) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { supabase, user, role };
}
