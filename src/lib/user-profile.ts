import type { OnboardingProfileData, UserProfile } from "@/lib/types";

export const RADIUS_OPTIONS = [
  { label: "Within 5 miles", miles: 5 },
  { label: "Within 10 miles", miles: 10 },
  { label: "Within 25 miles", miles: 25 },
  { label: "Within 50 miles", miles: 50 },
] as const;

export function radiusLabel(miles: number | null | undefined): string {
  const match = RADIUS_OPTIONS.find((option) => option.miles === miles);
  return match?.label ?? "Within 10 miles";
}

export function radiusFromLabel(label: string): number {
  const match = RADIUS_OPTIONS.find((option) => option.label === label);
  return match?.miles ?? 10;
}

export function displayName(profile: UserProfile | null): string {
  if (!profile) return "there";
  return (
    profile.preferred_name?.trim() ||
    profile.first_name?.trim() ||
    "there"
  );
}

export function calculateProfileCompletion(profile: UserProfile | null): number {
  if (!profile) return 0;

  const checks = [
    Boolean(profile.preferred_name?.trim() || profile.first_name?.trim()),
    Boolean(profile.city?.trim() && profile.state?.trim()),
    Boolean(profile.zip_code?.trim()),
    Boolean(profile.search_radius_miles),
    Boolean(profile.profile_data?.skills?.trim()),
    Boolean(profile.profile_data?.categories?.trim()),
    Boolean(profile.profile_data?.availability?.trim()),
    Boolean(profile.profile_data?.transport?.trim()),
    Boolean(profile.phone?.trim()),
    Boolean(profile.resume_url),
    profile.onboarding_completed,
  ];

  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

export function initialOnboardingStep(profile: UserProfile | null): number {
  const saved = profile?.profile_data?.onboarding_step;
  if (typeof saved === "number" && saved >= 0) return saved;
  return 0;
}

export function stepFieldValue(
  profile: UserProfile | null,
  stepId: string
): string {
  if (!profile) return "";

  switch (stepId) {
    case "name":
      return profile.preferred_name ?? profile.first_name ?? "";
    case "location":
      return "";
    case "radius":
      return radiusLabel(profile.search_radius_miles);
    default: {
      const value = profile.profile_data?.[stepId as keyof OnboardingProfileData];
      return typeof value === "string" ? value : "";
    }
  }
}

export function locationDefaults(profile: UserProfile | null) {
  return {
    city: profile?.city ?? "",
    state: profile?.state ?? "",
    zip: profile?.zip_code ?? "",
  };
}

export type SeekerLocation = {
  city: string;
  state: string;
  zip: string;
  label: string;
};

/** Cities treated as the same demo market when filtering local listings. */
const MARKET_NEIGHBORS: Record<string, string[]> = {
  clarksville: ["clarksville", "fort campbell", "oak grove", "hopkinsville"],
  nashville: [
    "nashville",
    "antioch",
    "madison",
    "goodlettsville",
    "hermitage",
    "bellevue",
    "brentwood",
    "franklin",
  ],
  murfreesboro: ["murfreesboro", "smyrna", "la vergne"],
  memphis: ["memphis", "bartlett", "germantown", "collierville"],
  knoxville: ["knoxville", "farragut"],
  chattanooga: ["chattanooga", "hixson", "east ridge"],
  "bowling green": [
    "bowling green",
    "warren",
    "oakland",
    "smiths grove",
    "plano",
    "alvaton",
  ],
  lexington: ["lexington", "nicholasville", "georgetown", "versailles"],
  louisville: ["louisville", "jeffersontown", "st. matthews", "shively"],
};

/** Full state names for statewide location matching (all US states + DC). */
const STATE_NAMES: Record<string, string> = {
  AL: "alabama",
  AK: "alaska",
  AZ: "arizona",
  AR: "arkansas",
  CA: "california",
  CO: "colorado",
  CT: "connecticut",
  DE: "delaware",
  DC: "district of columbia",
  FL: "florida",
  GA: "georgia",
  HI: "hawaii",
  ID: "idaho",
  IL: "illinois",
  IN: "indiana",
  IA: "iowa",
  KS: "kansas",
  KY: "kentucky",
  LA: "louisiana",
  ME: "maine",
  MD: "maryland",
  MA: "massachusetts",
  MI: "michigan",
  MN: "minnesota",
  MS: "mississippi",
  MO: "missouri",
  MT: "montana",
  NE: "nebraska",
  NV: "nevada",
  NH: "new hampshire",
  NJ: "new jersey",
  NM: "new mexico",
  NY: "new york",
  NC: "north carolina",
  ND: "north dakota",
  OH: "ohio",
  OK: "oklahoma",
  OR: "oregon",
  PA: "pennsylvania",
  RI: "rhode island",
  SC: "south carolina",
  SD: "south dakota",
  TN: "tennessee",
  TX: "texas",
  UT: "utah",
  VT: "vermont",
  VA: "virginia",
  WA: "washington",
  WV: "west virginia",
  WI: "wisconsin",
  WY: "wyoming",
};

/** Prefer the seeker's profile location; fall back to demo market only when unset. */
export function resolveSeekerLocation(
  profile: Pick<UserProfile, "city" | "state" | "zip_code"> | null | undefined
): SeekerLocation {
  const city = profile?.city?.trim() || "";
  const state = profile?.state?.trim() || "";
  const zip = profile?.zip_code?.trim() || "";

  if (city || state) {
    const resolvedCity = city || "Your area";
    const resolvedState = state.toUpperCase();
    const labelParts = [resolvedCity, resolvedState].filter(Boolean);
    return {
      city: resolvedCity,
      state: resolvedState,
      zip,
      label: zip ? `${labelParts.join(", ")} ${zip}` : labelParts.join(", "),
    };
  }

  return {
    city: "Nashville",
    state: "TN",
    zip: "37203",
    label: "Nashville, TN 37203",
  };
}

function normalizePlace(value: string): string {
  return value.trim().toLowerCase();
}

export function marketCitiesFor(seeker: SeekerLocation): string[] {
  const city = normalizePlace(seeker.city);
  if (!city) return [];

  for (const [hub, cities] of Object.entries(MARKET_NEIGHBORS)) {
    if (city === hub || city.includes(hub) || cities.includes(city)) {
      return cities;
    }
  }

  return [city];
}

function isStatewideLocation(locationText: string, stateCode: string): boolean {
  const haystack = normalizePlace(locationText);
  const code = stateCode.toUpperCase();
  const fullName = STATE_NAMES[code] ?? "";

  // Shared online workshops/resources are available to any seeker.
  if (haystack === "online" || haystack.startsWith("online ")) return true;

  // Unknown state code: never treat another state's "statewide" listing as a match.
  if (!fullName) return false;

  const mentionsThisState =
    haystack.includes(fullName) ||
    haystack.includes(`, ${code.toLowerCase()}`) ||
    haystack.endsWith(` ${code.toLowerCase()}`) ||
    haystack.startsWith(`${code.toLowerCase()} `);

  if (haystack.includes("statewide")) return mentionsThisState;

  return (
    haystack === `${fullName} (statewide)` ||
    haystack === fullName ||
    haystack.startsWith(`${fullName},`)
  );
}

/** True when a listing is in the seeker's city or nearby market (not the whole state). */
export function locationMatchesMarket(
  locationText: string | null | undefined,
  seeker: SeekerLocation
): boolean {
  if (!locationText) return false;
  const haystack = normalizePlace(locationText);
  const cities = marketCitiesFor(seeker);
  const stateCode = seeker.state.toUpperCase();
  const stateName = STATE_NAMES[stateCode];

  // Avoid matching another state's city with the same name (e.g. Springfield).
  if (stateName && haystack.includes(",") && !haystack.includes(stateName) && !haystack.includes(`, ${stateCode.toLowerCase()}`)) {
    // Still allow city-only strings without a state suffix.
    const hasOtherState = Object.entries(STATE_NAMES).some(
      ([code, name]) =>
        code !== stateCode &&
        (haystack.includes(`, ${code.toLowerCase()}`) || haystack.endsWith(` ${name}`) || haystack.includes(`, ${name}`))
    );
    if (hasOtherState) return false;
  }

  return cities.some((city) => city && haystack.includes(city));
}

/** Statewide / online supports for the seeker's state (not another state's agencies). */
export function locationMatchesStatewide(
  locationText: string | null | undefined,
  seeker: SeekerLocation
): boolean {
  if (!locationText) return false;
  return isStatewideLocation(locationText, seeker.state);
}

export function prioritizeJobsForLocation<T extends { location: string }>(
  jobs: T[],
  seeker: SeekerLocation
): T[] {
  const local = jobs.filter((job) => locationMatchesMarket(job.location, seeker));
  if (local.length > 0) return local;

  const statewide = jobs.filter((job) => locationMatchesStatewide(job.location, seeker));
  if (statewide.length > 0) return statewide;

  // Do not dump another city's listings (e.g. Nashville) when seeker is elsewhere.
  return [];
}

export function filterLocalThenStatewide<T extends { location: string }>(
  items: T[],
  seeker: SeekerLocation
): T[] {
  const local = items.filter((item) => locationMatchesMarket(item.location, seeker));
  const statewide = items.filter(
    (item) =>
      locationMatchesStatewide(item.location, seeker) &&
      !locationMatchesMarket(item.location, seeker)
  );
  return [...local, ...statewide];
}

export type ProfileUpdatePayload = {
  preferred_name?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  search_radius_miles?: number | null;
  profile_data?: OnboardingProfileData | null;
  onboarding_completed?: boolean;
};

export function mergeProfileData(
  existing: OnboardingProfileData | null | undefined,
  patch: OnboardingProfileData
): OnboardingProfileData {
  return { ...(existing ?? {}), ...patch };
}

export type OnboardingDraft = {
  step: number;
  preferredName: string;
  city: string;
  state: string;
  zip: string;
  radius: string;
  stepValues: Record<string, string>;
  updatedAt: string;
};

export function onboardingDraftKey(userId: string): string {
  return `dm-onboarding-${userId}`;
}

export function readOnboardingDraft(userId: string): OnboardingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(onboardingDraftKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingDraft;
  } catch {
    return null;
  }
}

export function writeOnboardingDraft(userId: string, draft: OnboardingDraft): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(onboardingDraftKey(userId), JSON.stringify(draft));
}

export function clearOnboardingDraft(userId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(onboardingDraftKey(userId));
}

export function buildOnboardingPayload(input: {
  step: number;
  preferredName: string;
  city: string;
  state: string;
  zip: string;
  radius: string;
  stepValues: Record<string, string>;
  onboardingCompleted?: boolean;
}): ProfileUpdatePayload {
  const searchRadiusMiles = radiusFromLabel(input.radius);

  return {
    preferred_name: input.preferredName.trim() || null,
    city: input.city.trim() || null,
    state: input.state.trim() || null,
    zip_code: input.zip.trim() || null,
    search_radius_miles: searchRadiusMiles,
    profile_data: {
      ...input.stepValues,
      onboarding_step: input.step,
      preferred_name: input.preferredName.trim() || undefined,
      city: input.city.trim() || undefined,
      state: input.state.trim() || undefined,
      zip_code: input.zip.trim() || undefined,
      search_radius_miles: searchRadiusMiles,
      restrictions: input.stepValues.restrictions ?? "",
    },
    onboarding_completed: input.onboardingCompleted ?? false,
  };
}

export function readOnboardingData(row: Record<string, unknown>): OnboardingProfileData {
  const raw = row.onboarding_data ?? row.profile_data;
  if (raw && typeof raw === "object") {
    return raw as OnboardingProfileData;
  }
  return {};
}

export function newJobSeekerProfileRow(userId: string) {
  return {
    user_id: userId,
    role: "job_seeker",
    onboarding_completed: false,
    onboarding_data: { onboarding_step: 0 },
  };
}

export function normalizeOnboardingProfile(row: Record<string, unknown>): UserProfile {
  const onboardingData = readOnboardingData(row);
  const onboardingStep =
    typeof row.onboarding_step === "number"
      ? row.onboarding_step
      : onboardingData.onboarding_step ?? 0;

  return {
    ...(row as UserProfile),
    preferred_name:
      (row.preferred_name as string | null | undefined) ??
      (onboardingData.preferred_name as string | undefined) ??
      null,
    city:
      (row.city as string | null | undefined) ??
      (onboardingData.city as string | undefined) ??
      null,
    state:
      (row.state as string | null | undefined) ??
      (onboardingData.state as string | undefined) ??
      null,
    zip_code:
      (row.zip_code as string | null | undefined) ??
      (onboardingData.zip_code as string | undefined) ??
      null,
    search_radius_miles:
      (row.search_radius_miles as number | null | undefined) ??
      (onboardingData.search_radius_miles as number | undefined) ??
      null,
    onboarding_completed: Boolean(row.onboarding_completed),
    profile_data: { ...onboardingData, onboarding_step: onboardingStep },
  };
}

export function buildDatabaseProfileUpdate(
  existing: Record<string, unknown>,
  body: ProfileUpdatePayload
): Record<string, unknown> {
  const existingData = readOnboardingData(existing);
  const mergedData = body.profile_data
    ? mergeProfileData(existingData, body.profile_data)
    : existingData;

  const onboardingData: OnboardingProfileData = {
    ...mergedData,
    preferred_name: body.preferred_name ?? mergedData.preferred_name,
    city: body.city ?? mergedData.city,
    state: body.state ?? mergedData.state,
    zip_code: body.zip_code ?? mergedData.zip_code,
    search_radius_miles: body.search_radius_miles ?? mergedData.search_radius_miles,
  };

  const update: Record<string, unknown> = {
    onboarding_data: onboardingData,
    onboarding_completed:
      body.onboarding_completed !== undefined
        ? body.onboarding_completed
        : existing.onboarding_completed,
    updated_at: new Date().toISOString(),
  };

  // Keep step inside onboarding_data only — avoid failing if onboarding_step column is missing
  return update;
}
