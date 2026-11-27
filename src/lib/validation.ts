import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

/** Reject request bodies larger than this before parsing (bytes). */
const MAX_BODY_BYTES = 64 * 1024;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Trimmed string, empty becomes null. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));

const requiredText = (max: number) => z.string().trim().min(1).max(max);

const optionalBool = z.boolean().optional().default(false);

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const jobSchema = z.object({
  title: requiredText(200),
  location: requiredText(200),
  salaryRange: optionalText(100),
  description: requiredText(10_000),
  felonFriendly: optionalBool,
});

/** Accept "acme.com" or "https://acme.com"; reject other schemes (javascript:, data:, …). */
const websiteSchema = z
  .string()
  .trim()
  .max(300)
  .nullish()
  .transform((value, ctx) => {
    if (!value) return null;
    const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
    try {
      const url = new URL(withScheme);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
      return url.toString();
    } catch {
      ctx.addIssue({ code: "custom", message: "Enter a valid website address." });
      return z.NEVER;
    }
  });

export const companyProfileSchema = z.object({
  company_name: requiredText(200),
  website: websiteSchema,
  location: optionalText(200),
  description: optionalText(5_000),
  felon_friendly: optionalBool,
});

const onboardingDataSchema = z.record(z.string(), z.unknown());

export const userProfileCreateSchema = z.object({
  first_name: requiredText(100),
  last_name: requiredText(100),
  about: optionalText(2_000),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullish()
    .transform((value) => value ?? null),
  phone: optionalText(30),
  phone_visible_to_employers: optionalBool,
  contact_consent: optionalBool,
  street_address: optionalText(200),
  city: optionalText(100),
  county: optionalText(100),
  state: optionalText(50),
  zip_code: optionalText(10),
  resume_url: optionalText(200),
  heard_about_us: optionalText(100),
  preferred_name: optionalText(100),
  search_radius_miles: z.number().int().min(0).max(500).nullish().transform((v) => v ?? null),
  onboarding_completed: optionalBool,
  profile_data: onboardingDataSchema.nullish(),
  onboarding_data: onboardingDataSchema.nullish(),
});

export const userProfilePatchSchema = z.object({
  preferred_name: optionalText(100).optional(),
  city: optionalText(100).optional(),
  state: optionalText(50).optional(),
  zip_code: optionalText(10).optional(),
  search_radius_miles: z.number().int().min(0).max(500).nullish(),
  profile_data: onboardingDataSchema.nullish(),
  onboarding_completed: z.boolean().optional(),
});

export const jobApplicationSchema = z.object({
  job_id: z.string().regex(UUID_RE),
  action: z.enum(["save", "apply"]),
  note: optionalText(2_000),
});

export const JOB_REPORT_REASONS = [
  "scam",
  "asks_for_money",
  "personal_info",
  "offensive",
  "misleading",
  "other",
] as const;

export const jobReportSchema = z.object({
  job_id: z.string().regex(UUID_RE),
  reason: z.enum(JOB_REPORT_REASONS),
  details: optionalText(2_000),
});

/** A resume path must live in the caller's own folder: "<userId>/resume.<ext>". */
export function isOwnResumePath(path: string, userId: string): boolean {
  return new RegExp(`^${userId}/resume\\.(pdf|docx?)$`).test(path);
}

// ---------------------------------------------------------------------------
// Request parsing
// ---------------------------------------------------------------------------

type Parsed<T> = { data: T } | { error: NextResponse };

/** Read a JSON body with a size cap and validate it against `schema`. */
export async function parseJsonBody<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<Parsed<z.output<T>>> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return { error: NextResponse.json({ error: "Request too large" }, { status: 413 }) };
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return { error: NextResponse.json({ error: "Invalid request" }, { status: 400 }) };
  }
  if (raw.length > MAX_BODY_BYTES) {
    return { error: NextResponse.json({ error: "Request too large" }, { status: 413 }) };
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { error: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) };
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path.join(".")).filter(Boolean))];
    return {
      error: NextResponse.json(
        {
          error: fields.length
            ? `Please check these fields: ${fields.join(", ")}`
            : "Invalid request",
        },
        { status: 400 }
      ),
    };
  }

  return { data: result.data };
}
