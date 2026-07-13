import type { DbJobRow } from "@/lib/jobs/db-types";
import type { Job, JobTag } from "@/lib/types";

const DEFAULT_TAGS: JobTag[] = ["AI-generated summary"];

function parseTags(raw: string[] | null, felonFriendly: boolean): JobTag[] {
  const allowed = new Set<JobTag>(DEFAULT_TAGS);
  for (const tag of raw ?? []) {
    if (
      [
        "Felony-friendly",
        "Background check required",
        "No CDL",
        "Housing provided",
        "Entry level",
        "Weekly pay",
        "Training provided",
        "Transportation accessible",
        "Second-chance employer",
        "AI-generated summary",
      ].includes(tag)
    ) {
      allowed.add(tag as JobTag);
    }
  }
  if (felonFriendly) allowed.add("Felony-friendly");
  return [...allowed];
}

function clampRating(value: number | null, felonFriendly: boolean): 0 | 1 | 2 | 3 | 4 | 5 {
  if (value !== null && value >= 0 && value <= 5) {
    return Math.round(value) as 0 | 1 | 2 | 3 | 4 | 5;
  }
  return felonFriendly ? 4 : 2;
}

function computeMatchScore(rating: number, felonFriendly: boolean): number {
  const base = 50 + rating * 8;
  const bump = felonFriendly ? 10 : 0;
  return Math.min(98, Math.max(45, base + bump));
}

export function mapDbJobToDisplay(
  row: DbJobRow,
  company: { company_name: string; felon_friendly: boolean } | null,
): Job {
  const employer = company?.company_name ?? "Employer";
  const rating = clampRating(row.felony_friendly_rating, row.felon_friendly);
  const tags = parseTags(row.ai_tags, row.felon_friendly);
  const matchScore = computeMatchScore(rating, row.felon_friendly);

  const aiSummary =
    row.ai_summary ??
    `AI-generated: ${row.title} at ${employer}. Enrichment pending — check back soon or contact the employer directly.`;

  const requiredSkills = Array.isArray(row.required_skills) ? row.required_skills : [];
  const preferredSkills = Array.isArray(row.preferred_skills) ? row.preferred_skills : [];

  return {
    id: row.id,
    title: row.title,
    employer,
    location: row.location,
    distance: "—",
    payRange: row.salary_range ?? "Pay not listed",
    employmentType:
      (row.employment_type as Job["employmentType"]) || "Full-time",
    schedule: row.schedule ?? "Schedule discussed at interview",
    aiSummary,
    description: row.description,
    requiredSkills: requiredSkills.length ? requiredSkills : ["See job description"],
    preferredSkills,
    tags,
    matchScore,
    felonyFriendlyRating: rating,
    source: "Destiny Manifesto",
    category: row.job_category ?? "General",
    matchReasons: {
      matchedSkills: requiredSkills.slice(0, 2),
      concerns: tags.includes("Background check required")
        ? ["Background check may be required"]
        : ["Confirm employer policies for your situation"],
      transportation: tags.includes("Transportation accessible")
        ? "May be reachable by public transit — verify route and hours"
        : "Check transportation to this location before applying",
      backgroundCheck: tags.includes("Background check required")
        ? "Background check likely required"
        : "Ask the employer about background screening timing",
      nextStep: row.felon_friendly
        ? "Strong employer signal for fair-chance hiring — apply with an updated resume"
        : "Call or message the employer to ask about conviction-related restrictions before applying",
    },
  };
}
