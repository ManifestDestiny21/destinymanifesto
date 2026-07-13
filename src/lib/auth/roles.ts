import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "employer" | "job_seeker";

export const EMPLOYER_PATHS = ["/employer/dashboard", "/profile", "/jobs/new"] as const;

export const SEEKER_PATHS = [
  "/dashboard",
  "/onboarding",
  "/saved-jobs",
  "/job-fairs",
  "/coach",
  "/resume",
  "/cover-letters",
  "/interview",
  "/resources",
  "/snap",
  "/housing",
  "/transportation",
  "/incentives",
  "/meetings",
  "/law-library",
  "/messages",
  "/subscription",
  "/settings",
  "/book",
] as const;

export function roleFromMetadata(user: User): UserRole | null {
  const raw = user.user_metadata?.role ?? user.app_metadata?.role;
  if (raw === "employer") return "employer";
  if (raw === "job_seeker" || raw === "job-seeker") return "job_seeker";
  return null;
}

export function getHomePath(role: UserRole): string {
  return role === "employer" ? "/employer/dashboard" : "/dashboard";
}

export function getLoginPath(role: UserRole): string {
  return role === "employer" ? "/login" : "/login?role=job-seeker";
}

export function isEmployerJobPath(pathname: string): boolean {
  return pathname === "/jobs/new" || /^\/jobs\/[^/]+\/edit$/.test(pathname);
}

export function isEmployerPath(pathname: string): boolean {
  if (EMPLOYER_PATHS.some((path) => pathname.startsWith(path))) return true;
  return isEmployerJobPath(pathname);
}

export function isSeekerJobsPath(pathname: string): boolean {
  if (pathname === "/jobs") return true;
  if (isEmployerJobPath(pathname)) return false;
  return pathname.startsWith("/jobs/");
}

export function isSeekerPath(pathname: string): boolean {
  if (SEEKER_PATHS.some((path) => pathname.startsWith(path))) return true;
  return isSeekerJobsPath(pathname);
}

export function isProtectedPath(pathname: string): boolean {
  return isEmployerPath(pathname) || isSeekerPath(pathname);
}

export function roleLabel(role: UserRole): string {
  return role === "employer" ? "employer" : "job seeker";
}

export async function resolveUserRole(
  supabase: SupabaseClient,
  user: User
): Promise<UserRole | null> {
  const fromMetadata = roleFromMetadata(user);
  if (fromMetadata) return fromMetadata;

  const [{ data: seekerProfile }, { data: employerProfile }] = await Promise.all([
    supabase.from("user_profiles").select("id").eq("user_id", user.id).maybeSingle(),
    supabase.from("company_profiles").select("id").eq("user_id", user.id).maybeSingle(),
  ]);

  if (seekerProfile && employerProfile) return null;
  if (seekerProfile) return "job_seeker";
  if (employerProfile) return "employer";
  return null;
}
