import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { isBearerAuthorized } from "@/lib/auth/bearer";
import { getUserRole } from "@/lib/auth/roles";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import {
  companyProfileSchema,
  isOwnResumePath,
  jobApplicationSchema,
  jobSchema,
  parseJsonBody,
} from "@/lib/validation";

const userWith = (meta: { app?: object; user?: object }) =>
  ({ id: "u1", app_metadata: meta.app ?? {}, user_metadata: meta.user ?? {} }) as unknown as User;

describe("role resolution", () => {
  it("uses the server-controlled app_metadata role", () => {
    expect(getUserRole(userWith({ app: { role: "employer" } }))).toBe("employer");
    expect(getUserRole(userWith({ app: { role: "job_seeker" } }))).toBe("job_seeker");
  });

  it("ignores user-editable user_metadata", () => {
    expect(getUserRole(userWith({ user: { role: "employer" } }))).toBeNull();
    expect(
      getUserRole(userWith({ app: { role: "job_seeker" }, user: { role: "employer" } }))
    ).toBe("job_seeker");
  });

  it("rejects unknown roles", () => {
    expect(getUserRole(userWith({ app: { role: "admin" } }))).toBeNull();
  });
});

describe("safeRedirectPath", () => {
  it.each(["/dashboard", "/jobs/abc?x=1", "/a#b"])("allows same-site path %s", (path) => {
    expect(safeRedirectPath(path)).toBe(path);
  });

  it.each([
    "@evil.com",
    ".evil.com",
    "//evil.com",
    "/\\evil.com",
    "/\\/evil.com",
    "https://evil.com",
    "/\t/evil.com",
    "javascript:alert(1)",
    "",
    null,
  ])("rejects %j", (path) => {
    expect(safeRedirectPath(path)).toBeNull();
  });
});

describe("isBearerAuthorized", () => {
  it("accepts only the exact secret", () => {
    expect(isBearerAuthorized("Bearer s3cret", "s3cret")).toBe(true);
    expect(isBearerAuthorized("Bearer wrong", "s3cret")).toBe(false);
    expect(isBearerAuthorized("s3cret", "s3cret")).toBe(false);
    expect(isBearerAuthorized(null, "s3cret")).toBe(false);
  });
});

describe("resume paths", () => {
  const uid = "11111111-2222-4333-8444-555555555555";
  it("accepts the caller's own resume", () => {
    expect(isOwnResumePath(`${uid}/resume.pdf`, uid)).toBe(true);
    expect(isOwnResumePath(`${uid}/resume.docx`, uid)).toBe(true);
  });
  it("rejects other users' folders, other files and public URLs", () => {
    expect(isOwnResumePath(`99999999-2222-4333-8444-555555555555/resume.pdf`, uid)).toBe(false);
    expect(isOwnResumePath(`${uid}/resume.html`, uid)).toBe(false);
    expect(isOwnResumePath(`https://x.supabase.co/storage/v1/object/public/resumes/${uid}/resume.pdf`, uid)).toBe(false);
  });
});

describe("validation", () => {
  it("accepts a normal job and trims fields", () => {
    const r = jobSchema.safeParse({
      title: "  Cook ",
      location: "Nashville",
      salaryRange: "",
      description: "Line cook",
      felonFriendly: true,
    });
    expect(r.success && r.data).toMatchObject({ title: "Cook", salaryRange: null });
  });

  it("rejects oversized or missing job fields", () => {
    expect(jobSchema.safeParse({ title: "", location: "x", description: "y" }).success).toBe(false);
    expect(
      jobSchema.safeParse({ title: "x", location: "x", description: "y".repeat(10_001) }).success
    ).toBe(false);
  });

  it("normalizes websites and rejects dangerous schemes", () => {
    const ok = companyProfileSchema.safeParse({ company_name: "Acme", website: "acme.com" });
    expect(ok.success && ok.data.website).toBe("https://acme.com/");
    expect(
      companyProfileSchema.safeParse({ company_name: "Acme", website: "javascript:alert(1)" }).success
    ).toBe(false);
  });

  it("requires a UUID job id and a known action", () => {
    expect(jobApplicationSchema.safeParse({ job_id: "mock-1", action: "save" }).success).toBe(false);
    expect(
      jobApplicationSchema.safeParse({
        job_id: "11111111-2222-4333-8444-555555555555",
        action: "delete",
      }).success
    ).toBe(false);
  });

  it("rejects oversized request bodies", async () => {
    const big = new Request("http://x/api", {
      method: "POST",
      body: JSON.stringify({ title: "x".repeat(70_000) }),
    });
    const result = await parseJsonBody(big, jobSchema);
    expect("error" in result && result.error.status).toBe(413);
  });
});
