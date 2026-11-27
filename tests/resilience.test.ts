import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminClient, createServerClient } = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  createServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient }));
vi.mock("@supabase/ssr", () => ({ createServerClient }));

import { fetchSavedJobsForUser } from "@/lib/job-applications";
import {
  buildFeed,
  fetchLiveJobById,
  fetchLiveJobs,
  isDemoModeEnabled,
} from "@/lib/jobs/fetch-jobs";
import { updateSession } from "@/lib/supabase/middleware";
import { isAuthOutage, needsSessionCheck } from "@/lib/supabase/session-policy";
import type { Job } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Result = { data?: unknown; error?: { message: string } | null };

interface Builder {
  select(): Builder;
  order(): Builder;
  limit(): Builder;
  in(): Builder;
  eq(): Builder;
  then(resolve: (value: Result) => unknown, reject?: (reason: unknown) => unknown): Promise<unknown>;
}

/** A Supabase client whose queries resolve to a fixed result per table. */
function fakeClient(results: Record<string, Result>) {
  return {
    from(table: string) {
      const result: Result = { data: null, error: null, ...(results[table] ?? {}) };
      const builder: Builder = {
        select: () => builder,
        order: () => builder,
        limit: () => builder,
        in: () => builder,
        eq: () => builder,
        then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
      };
      return builder;
    },
  };
}

const JOB_ID = "11111111-2222-4333-8444-555555555555";
const EMPLOYER_ID = "99999999-2222-4333-8444-555555555555";

const jobRow = (id = JOB_ID, location = "Nashville, TN") => ({
  id,
  employer_id: EMPLOYER_ID,
  title: "Line Cook",
  location,
  salary_range: null,
  description: "Cook food",
  felon_friendly: true,
  employment_type: null,
  schedule: null,
  job_category: null,
  required_skills: [],
  preferred_skills: [],
  ai_summary: null,
  ai_tags: [],
  felony_friendly_rating: null,
  ai_enriched_at: null,
  created_at: "2026-01-01T00:00:00Z",
});

const company = { user_id: EMPLOYER_ID, company_name: "Acme", felon_friendly: true };

const listJob = (n: number) => ({ id: `job-${n}`, title: `Job ${n}`, employer: "Acme", location: "Nashville, TN", description: "x" }) as unknown as Job;

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  createAdminClient.mockReset();
  createServerClient.mockReset();
});

// ---------------------------------------------------------------------------
// Job feed
// ---------------------------------------------------------------------------

describe("demo mode", () => {
  it("is off in production unless explicitly enabled", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isDemoModeEnabled()).toBe(false);
    vi.stubEnv("ENABLE_DEMO_MODE", "true");
    expect(isDemoModeEnabled()).toBe(true);
  });

  it("is on in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isDemoModeEnabled()).toBe(true);
  });
});

describe("fetchLiveJobs in production", () => {
  beforeEach(() => vi.stubEnv("NODE_ENV", "production"));

  it("reports an outage instead of showing demo jobs when credentials are missing", async () => {
    createAdminClient.mockReturnValue(null);
    const feed = await fetchLiveJobs();
    expect(feed.source).toBe("unavailable");
    expect(feed.jobs).toEqual([]);
  });

  it("reports an outage when the database query fails", async () => {
    createAdminClient.mockReturnValue(
      fakeClient({ seeker_visible_jobs: { error: { message: "connection refused" } } })
    );
    const feed = await fetchLiveJobs();
    expect(feed.source).toBe("unavailable");
    expect(feed.jobs).toEqual([]);
  });

  it("reports an outage when the client throws", async () => {
    createAdminClient.mockImplementation(() => {
      throw new Error("boom");
    });
    expect((await fetchLiveJobs()).source).toBe("unavailable");
  });

  it("treats a healthy but empty marketplace as empty, not as an outage", async () => {
    createAdminClient.mockReturnValue(fakeClient({ seeker_visible_jobs: { data: [] } }));
    const feed = await fetchLiveJobs();
    expect(feed.source).toBe("supabase");
    expect(feed.jobs).toEqual([]);
  });

  it("returns live jobs when the query succeeds", async () => {
    createAdminClient.mockReturnValue(
      fakeClient({ seeker_visible_jobs: { data: [jobRow()] }, company_profiles: { data: [company] } })
    );
    const feed = await fetchLiveJobs();
    expect(feed.source).toBe("supabase");
    expect(feed.jobs.map((j) => j.employer)).toEqual(["Acme"]);
  });

  it("serves demo jobs on failure only when ENABLE_DEMO_MODE is set", async () => {
    vi.stubEnv("ENABLE_DEMO_MODE", "true");
    createAdminClient.mockReturnValue(null);
    const feed = await fetchLiveJobs();
    expect(feed.source).toBe("mock");
    expect(feed.jobs.length).toBeGreaterThan(0);
  });
});

describe("fetchLiveJobs in development", () => {
  it("keeps falling back to demo jobs so local work needs no database", async () => {
    vi.stubEnv("NODE_ENV", "development");
    createAdminClient.mockReturnValue(null);
    const feed = await fetchLiveJobs();
    expect(feed.source).toBe("mock");
    expect(feed.jobs.length).toBeGreaterThan(0);
  });
});

describe("buildFeed pagination", () => {
  const jobs = Array.from({ length: 45 }, (_, i) => listJob(i + 1));

  it("returns one page with a next-page flag", () => {
    const feed = buildFeed(jobs, "supabase", { page: 1, pageSize: 20 });
    expect(feed.jobs).toHaveLength(20);
    expect(feed.total).toBe(45);
    expect(feed.hasMore).toBe(true);
  });

  it("returns the remainder on the last page and clamps out-of-range pages", () => {
    const last = buildFeed(jobs, "supabase", { page: 3, pageSize: 20 });
    expect(last.jobs).toHaveLength(5);
    expect(last.hasMore).toBe(false);
    expect(buildFeed(jobs, "supabase", { page: 99, pageSize: 20 }).page).toBe(3);
    expect(buildFeed(jobs, "supabase", { page: -4, pageSize: 20 }).page).toBe(1);
  });

  it("filters by search query before paginating", () => {
    const feed = buildFeed(jobs, "supabase", { query: "job 4", pageSize: 20 });
    expect(feed.jobs.map((j) => j.title)).toEqual(["Job 4", "Job 40", "Job 41", "Job 42", "Job 43", "Job 44", "Job 45"]);
    expect(feed.total).toBe(7);
  });
});

describe("fetchLiveJobById in production", () => {
  beforeEach(() => vi.stubEnv("NODE_ENV", "production"));

  it("does not query the database for non-UUID ids and reports not found", async () => {
    const result = await fetchLiveJobById("job-1");
    expect(result).toEqual({ job: null, source: "supabase" });
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("distinguishes a lookup failure from a missing job", async () => {
    createAdminClient.mockReturnValue(
      fakeClient({ seeker_visible_jobs: { error: { message: "timeout" } } })
    );
    expect(await fetchLiveJobById(JOB_ID)).toEqual({ job: null, source: "unavailable" });

    createAdminClient.mockReturnValue(fakeClient({ seeker_visible_jobs: { data: [] } }));
    expect(await fetchLiveJobById(JOB_ID)).toEqual({ job: null, source: "supabase" });
  });
});

// ---------------------------------------------------------------------------
// Saved jobs
// ---------------------------------------------------------------------------

describe("fetchSavedJobsForUser", () => {
  const application = {
    id: "a1",
    user_id: "u1",
    job_id: JOB_ID,
    status: "applied",
    note: null,
    applied_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  it("keeps applications whose listing was hidden, with a null job", async () => {
    createAdminClient.mockReturnValue(fakeClient({ seeker_visible_jobs: { data: [] } }));
    const supabase = fakeClient({ job_applications: { data: [application] } });

    const result = await fetchSavedJobsForUser(supabase as never, "u1");
    expect(result.loadFailed).toBe(false);
    expect(result.detailsUnavailable).toBe(false);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].job).toBeNull();
  });

  it("flags unavailable details when the job lookup fails", async () => {
    createAdminClient.mockReturnValue(
      fakeClient({ seeker_visible_jobs: { error: { message: "down" } } })
    );
    const supabase = fakeClient({ job_applications: { data: [application] } });

    const result = await fetchSavedJobsForUser(supabase as never, "u1");
    expect(result.detailsUnavailable).toBe(true);
    expect(result.entries[0].job).toBeNull();
  });

  it("reports a failed load instead of an empty list", async () => {
    const supabase = fakeClient({ job_applications: { error: { message: "down" } } });
    const result = await fetchSavedJobsForUser(supabase as never, "u1");
    expect(result.loadFailed).toBe(true);
    expect(result.entries).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Session middleware
// ---------------------------------------------------------------------------

describe("session policy", () => {
  it("only checks the session for private and session-aware paths", () => {
    for (const path of ["/dashboard", "/jobs", "/jobs/abc", "/profile", "/", "/login", "/signup", "/admin"]) {
      expect(needsSessionCheck(path)).toBe(true);
    }
    for (const path of ["/terms", "/privacy", "/cookies", "/sw.js", "/manifest.webmanifest", "/api/jobs", "/service-unavailable"]) {
      expect(needsSessionCheck(path)).toBe(false);
    }
  });

  it("separates outages from ordinary signed-out errors", () => {
    expect(isAuthOutage({ name: "AuthRetryableFetchError", status: 0 })).toBe(true);
    expect(isAuthOutage({ name: "AuthApiError", status: 503 })).toBe(true);
    expect(isAuthOutage({ name: "AuthSessionMissingError", status: 400 })).toBe(false);
    expect(isAuthOutage({ name: "AuthApiError", status: 401 })).toBe(false);
    expect(isAuthOutage(null)).toBe(false);
  });
});

describe("updateSession during a Supabase outage", () => {
  const request = (path: string) => new NextRequest(`http://localhost${path}`);
  const withAuth = (getUser: () => Promise<unknown>) =>
    createServerClient.mockReturnValue({ auth: { getUser } });

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
  });

  it("returns 503 for protected pages when auth throws", async () => {
    withAuth(() => Promise.reject(new Error("network down")));
    const res = await updateSession(request("/dashboard"));
    expect(res.status).toBe(503);
    expect(res.headers.get("x-middleware-rewrite")).toContain("/service-unavailable");
    expect(res.headers.get("retry-after")).toBe("30");
  });

  it("returns 503 for protected pages when auth reports a network failure", async () => {
    withAuth(async () => ({
      data: { user: null },
      error: { name: "AuthRetryableFetchError", status: 0, message: "fetch failed" },
    }));
    expect((await updateSession(request("/employer/dashboard"))).status).toBe(503);
  });

  it("lets public pages load without a session", async () => {
    withAuth(() => Promise.reject(new Error("network down")));
    const res = await updateSession(request("/login"));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });

  it("still redirects a normal signed-out visitor to login", async () => {
    withAuth(async () => ({
      data: { user: null },
      error: { name: "AuthSessionMissingError", status: 400, message: "Auth session missing" },
    }));
    const res = await updateSession(request("/dashboard"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("treats a hung auth call as an outage", async () => {
    vi.useFakeTimers();
    try {
      withAuth(() => new Promise(() => {}));
      const pending = updateSession(request("/dashboard"));
      await vi.advanceTimersByTimeAsync(5000);
      expect((await pending).status).toBe(503);
    } finally {
      vi.useRealTimers();
    }
  });

  it("skips Supabase entirely for static pages", async () => {
    const getUser = vi.fn();
    withAuth(getUser);
    const res = await updateSession(request("/terms"));
    expect(res.status).toBe(200);
    expect(getUser).not.toHaveBeenCalled();
  });
});
