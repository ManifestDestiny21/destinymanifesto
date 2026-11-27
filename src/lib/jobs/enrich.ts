export type JobEnrichmentInput = {
  title: string;
  location: string;
  salary_range: string | null;
  description: string;
  felon_friendly: boolean;
  company_name?: string | null;
  company_felon_friendly?: boolean;
};

export type JobEnrichmentResult = {
  ai_summary: string;
  ai_tags: string[];
  felony_friendly_rating: number;
  employment_type: string;
  schedule: string;
  job_category: string;
  required_skills: string[];
  preferred_skills: string[];
};

const ALLOWED_TAGS = [
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
] as const;

function textBlob(job: JobEnrichmentInput): string {
  return `${job.title} ${job.location} ${job.salary_range ?? ""} ${job.description} ${job.company_name ?? ""}`.toLowerCase();
}

function inferTags(blob: string, job: JobEnrichmentInput): string[] {
  const tags = new Set<string>(["AI-generated summary"]);

  if (job.felon_friendly || job.company_felon_friendly) tags.add("Felony-friendly");
  if (/second.?chance|fair.?chance|justice|reentry|returning citizen/i.test(blob)) {
    tags.add("Second-chance employer");
    tags.add("Felony-friendly");
  }
  if (/background check|background screening/i.test(blob)) tags.add("Background check required");
  if (/no cdl|without cdl|cdl not required/i.test(blob)) tags.add("No CDL");
  if (/housing provided|housing available|room and board/i.test(blob)) tags.add("Housing provided");
  if (/entry.?level|no experience required|will train/i.test(blob)) tags.add("Entry level");
  if (/weekly pay|paid weekly/i.test(blob)) tags.add("Weekly pay");
  if (/training provided|on.?the.?job training|otj/i.test(blob)) tags.add("Training provided");
  if (/bus line|public transit|transportation/i.test(blob)) tags.add("Transportation accessible");

  return ALLOWED_TAGS.filter((t) => tags.has(t));
}

function inferRating(blob: string, job: JobEnrichmentInput, tags: string[]): number {
  let score = 2;

  if (job.felon_friendly) score += 2;
  if (job.company_felon_friendly) score += 1;
  if (tags.includes("Second-chance employer")) score += 1;
  if (tags.includes("Felony-friendly")) score += 1;
  if (/no felony|must not have felony|disqualif/i.test(blob)) score -= 3;
  if (/security clearance|bond required|financial crime/i.test(blob)) score -= 2;
  if (/cdl required|class [ab] cdl/i.test(blob) && !tags.includes("No CDL")) score -= 1;

  return Math.max(0, Math.min(5, score));
}

function inferCategory(title: string, blob: string): string {
  if (/warehouse|fulfillment|picker|packer/i.test(blob)) return "Warehouse";
  if (/cook|kitchen|food|restaurant|server/i.test(blob)) return "Food Service";
  if (/driver|delivery|cdl/i.test(blob)) return "Transportation";
  if (/maintenance|hvac|technician/i.test(blob)) return "Skilled Trades";
  if (/construction|laborer/i.test(blob)) return "Construction";
  if (/customer service|retail|cashier/i.test(blob)) return "Retail";
  return title.split(" ")[0] || "General";
}

function inferEmploymentType(blob: string): string {
  if (/part.?time|pt\b/i.test(blob)) return "Part-time";
  if (/contract|temp\b|temporary/i.test(blob)) return "Contract";
  return "Full-time";
}

function inferSchedule(blob: string): string {
  if (/weekend|evening|night shift/i.test(blob)) return "Flexible / shifts vary";
  if (/mon.?fri|monday.?friday|day shift/i.test(blob)) return "Mon–Fri, day shift";
  return "Schedule discussed at interview";
}

function inferSkills(blob: string): { required: string[]; preferred: string[] } {
  const required: string[] = [];
  const preferred: string[] = [];

  if (/reliable|attendance|punctual/i.test(blob)) required.push("Reliable attendance");
  if (/lift|50 lb|physical/i.test(blob)) required.push("Ability to meet physical job requirements");
  if (/driver.?s license|valid license/i.test(blob)) required.push("Valid driver's license");
  if (/food handler/i.test(blob)) required.push("Food handler card (or willingness to obtain)");
  if (/forklift/i.test(blob)) preferred.push("Forklift experience");
  if (/hvac|epa/i.test(blob)) preferred.push("Trade certification");

  if (required.length === 0) required.push("Willingness to learn and follow workplace policies");
  return { required, preferred };
}

export function enrichJobHeuristic(job: JobEnrichmentInput): JobEnrichmentResult {
  const blob = textBlob(job);
  const ai_tags = inferTags(blob, job);
  const felony_friendly_rating = inferRating(blob, job, ai_tags);
  const { required, preferred } = inferSkills(blob);

  const ratingLabel =
    felony_friendly_rating >= 4
      ? "may be a strong fit for fair-chance hiring"
      : felony_friendly_rating >= 3
        ? "could be a possible fit depending on your record and the role"
        : "has uncertain felony-friendly likelihood — confirm with the employer";

  const ai_summary = `AI-generated: ${job.title} at ${job.company_name ?? "this employer"} in ${job.location}. This role ${ratingLabel}. ${job.felon_friendly ? "Employer marked the job as felony-friendly." : "Review background check and license requirements before applying."}`;

  return {
    ai_summary,
    ai_tags,
    felony_friendly_rating,
    employment_type: inferEmploymentType(blob),
    schedule: inferSchedule(blob),
    job_category: inferCategory(job.title, blob),
    required_skills: required,
    preferred_skills: preferred,
  };
}

async function enrichJobOpenAI(job: JobEnrichmentInput): Promise<JobEnrichmentResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const system = `You help justice-impacted job seekers understand job postings. Respond ONLY with valid JSON, no markdown.
Fields: ai_summary (2 sentences, start with "AI-generated:"), ai_tags (array from: ${ALLOWED_TAGS.join(", ")}), felony_friendly_rating (integer 0-5), employment_type (Full-time|Part-time|Contract), schedule (short string), job_category, required_skills (string[]), preferred_skills (string[]).
Rating guide: 0=less likely felony-friendly, 5=higher probability. This is an estimate, not a guarantee.`;

  const user = JSON.stringify({
    title: job.title,
    company: job.company_name,
    location: job.location,
    salary_range: job.salary_range,
    description: job.description,
    felon_friendly: job.felon_friendly,
    company_felon_friendly: job.company_felon_friendly,
  });

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 600,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
      // Don't let a slow upstream hang the request; we fall back to heuristics.
      signal: AbortSignal.timeout(20_000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as JobEnrichmentResult;
    const rating = Math.max(0, Math.min(5, Math.round(Number(parsed.felony_friendly_rating) || 2)));

    return {
      ai_summary: parsed.ai_summary?.startsWith("AI-generated")
        ? parsed.ai_summary
        : `AI-generated: ${parsed.ai_summary}`,
      ai_tags: (parsed.ai_tags ?? []).filter((t) =>
        ALLOWED_TAGS.includes(t as (typeof ALLOWED_TAGS)[number]),
      ),
      felony_friendly_rating: rating,
      employment_type: parsed.employment_type || "Full-time",
      schedule: parsed.schedule || "Schedule discussed at interview",
      job_category: parsed.job_category || "General",
      required_skills: parsed.required_skills?.length ? parsed.required_skills : ["Reliable attendance"],
      preferred_skills: parsed.preferred_skills ?? [],
    };
  } catch {
    return null;
  }
}

export async function enrichJob(job: JobEnrichmentInput): Promise<JobEnrichmentResult> {
  const ai = await enrichJobOpenAI(job);
  if (ai) {
    if (!ai.ai_tags.includes("AI-generated summary")) {
      ai.ai_tags.push("AI-generated summary");
    }
    return ai;
  }
  return enrichJobHeuristic(job);
}
