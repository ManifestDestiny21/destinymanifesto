import "server-only";

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getHomePath,
  getLoginPath,
  getUserRole,
  isAdmin,
  type UserRole,
} from "@/lib/auth/roles";

export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const role = getUserRole(user);
  return { supabase, user, role };
}

export async function requireRole(expected: UserRole) {
  const { supabase, user, role } = await requireAuth();

  if (role && role !== expected) {
    redirect(getHomePath(role));
  }

  if (!role) {
    redirect(expected === "employer" ? "/profile" : "/onboarding");
  }

  return { supabase, user, role };
}

export async function redirectIfAuthenticated() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const role = getUserRole(user);
  if (role) {
    redirect(getHomePath(role));
  }
}

export async function redirectWrongRoleLogin(expected: UserRole) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const role = getUserRole(user);
  if (role && role !== expected) {
    redirect(getHomePath(role));
  }
}

/** Admin-only pages. Non-admins get a 404 so the page's existence isn't revealed. */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user)) {
    notFound();
  }

  return { supabase, user };
}

export function redirectToLogin(role: UserRole) {
  redirect(getLoginPath(role));
}
