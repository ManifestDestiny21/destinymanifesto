import type { User } from "@supabase/supabase-js";

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

/**
 * The role lives in `app_metadata`, which only the server (service role / DB trigger)
 * can write. Never read it from `user_metadata` — users can edit that themselves via
 * `supabase.auth.updateUser()`.
 */
export function getUserRole(user: User): UserRole | null {
  const raw = user.app_metadata?.role;
  if (raw === "employer") return "employer";
  if (raw === "job_seeker") return "job_seeker";
  return null;
}

/** Admin flag lives in app_metadata, which only SQL / the service role can set. */
export function isAdmin(user: User): boolean {
  return user.app_metadata?.is_admin === true;
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
