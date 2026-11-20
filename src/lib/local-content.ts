import { daysFromToday, formatMeetingWhen, isUpcoming, toLocalIso } from "@/lib/dates";
import { HOUSING, JOBS, LAW_ARTICLES, MEETINGS, MESSAGES, RESOURCES } from "@/lib/mock-data";
import type { HousingOption, Job, LawArticle, Meeting, Message, Resource } from "@/lib/types";
import {
  filterLocalThenStatewide,
  locationMatchesMarket,
  locationMatchesStatewide,
  type SeekerLocation,
} from "@/lib/user-profile";

function cityStateLabel(seeker: SeekerLocation): string {
  return `${seeker.city}, ${seeker.state}`;
}

function normalizeId(city: string): string {
  return city.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "local";
}

export type StateAgencyLinks = {
  snapName: string;
  snapLink: string;
  snapContact: string;
  snapBlurb: string;
  workforceLink: string;
  workforceName: string;
};

export function agencyLinksFor(state: string): StateAgencyLinks {
  switch (state.toUpperCase()) {
    case "KY":
      return {
        snapName: "CHFS / kynect SNAP",
        snapLink: "https://www.chfs.ky.gov/agencies/dcbs/dfs/Pages/food.aspx",
        snapContact: "kynect or local DCBS office",
        snapBlurb:
          "Kentucky CHFS / kynect handles SNAP applications. An interview may be required after you apply.",
        workforceLink: "https://kcc.ky.gov",
        workforceName: "Kentucky Career Center",
      };
    case "TN":
      return {
        snapName: "DHS / One DHS SNAP",
        snapLink:
          "https://www.tn.gov/humanservices/for-families/supplemental-nutrition-assistance-program-snap.html",
        snapContact: "Online or local DHS office",
        snapBlurb:
          "Tennessee DHS / One DHS handles SNAP applications. An interview may be required after you apply.",
        workforceLink: "https://www.jobs4tn.gov",
        workforceName: "American Job Center",
      };
    default: {
      const code = state.toUpperCase() || "your state";
      return {
        snapName: "SNAP / human services",
        snapLink: "https://www.fns.usda.gov/snap/state-directory",
        snapContact: "Your state human services office",
        snapBlurb: `Check your ${code} human services agency for SNAP applications. An interview may be required after you apply.`,
        workforceLink:
          "https://www.careeronestop.org/LocalHelp/AmericanJobCenters/find-american-job-centers.aspx",
        workforceName: "American Job Center",
      };
    }
  }
}

function localizeJobs(seeker: SeekerLocation): Job[] {
  const templates = JOBS.slice(0, 4);
  return templates.map((job, index) => ({
    ...job,
    id: `local-job-${normalizeId(seeker.city)}-${index + 1}`,
    employer: job.employer.replace(/Music City|Volunteer State|Cumberland/g, seeker.city),
    location: cityStateLabel(seeker),
    distance: `${(2.4 + index * 1.7).toFixed(1)} mi`,
    matchReasons: {
      ...job.matchReasons,
      transportation: `Within your search area around ${seeker.city}`,
    },
  }));
}

function localizeResources(seeker: SeekerLocation): Resource[] {
  const statewide = RESOURCES.filter((r) => locationMatchesStatewide(r.location, seeker));
  const agencies = agencyLinksFor(seeker.state);
  const localTemplates: Resource[] = [
    {
      id: `local-snap-${normalizeId(seeker.city)}`,
      name: `${seeker.city} ${agencies.snapName}`,
      category: "SNAP Benefits",
      location: cityStateLabel(seeker),
      distance: "2.0 mi",
      eligibility: "Income and household size based",
      contact: agencies.snapContact,
      link: agencies.snapLink,
      aiSummary: `AI-generated: Apply for SNAP and check case info for households in ${seeker.city}, ${seeker.state}.`,
    },
    {
      id: `local-housing-${normalizeId(seeker.city)}`,
      name: `${seeker.city} reentry & housing navigation`,
      category: "Housing",
      location: cityStateLabel(seeker),
      distance: "3.1 mi",
      eligibility: "Returning citizens; program policies apply",
      contact: "Intake / 211 referral",
      link: "https://www.211.org",
      aiSummary: `AI-generated: Local shelter, transitional housing, and rental help pathways near ${seeker.city}.`,
    },
    {
      id: `local-transit-${normalizeId(seeker.city)}`,
      name: `${seeker.city} job access transportation`,
      category: "Transportation",
      location: cityStateLabel(seeker),
      distance: "1.5 mi",
      eligibility: "Active job search or training participants",
      contact: "Workforce / transit desk",
      link: agencies.workforceLink,
      aiSummary: `AI-generated: Local transit and rideshare options for interviews and work near ${seeker.city}.`,
    },
    {
      id: `local-workforce-${normalizeId(seeker.city)}`,
      name: `${agencies.workforceName} — ${seeker.city}`,
      category: "Local Incentives",
      location: cityStateLabel(seeker),
      distance: "2.5 mi",
      eligibility: "Job seekers; ask about reentry / fair-chance services",
      contact: "Workforce front desk",
      link: agencies.workforceLink,
      aiSummary: `AI-generated: Resume help, job leads, and training referrals near ${seeker.city}.`,
    },
  ];

  return [...localTemplates, ...statewide];
}

function localizeHousing(seeker: SeekerLocation): HousingOption[] {
  return [
    {
      id: `local-h1-${normalizeId(seeker.city)}`,
      name: `${seeker.city} transitional housing path`,
      type: "Transitional housing",
      cost: "Sliding scale",
      distance: "3.4 mi",
      location: cityStateLabel(seeker),
      acceptsFelony: true,
      transitAccess: true,
      waitlistOpen: true,
    },
    {
      id: `local-h2-${normalizeId(seeker.city)}`,
      name: `${seeker.city} sober living`,
      type: "Sober living",
      cost: "$550–$700/mo",
      distance: "5.0 mi",
      location: cityStateLabel(seeker),
      acceptsFelony: true,
      transitAccess: false,
      waitlistOpen: true,
    },
    {
      id: `local-h3-${normalizeId(seeker.city)}`,
      name: `${seeker.city} emergency shelter / 211`,
      type: "Shelter",
      cost: "Free (short-term)",
      distance: "2.2 mi",
      location: cityStateLabel(seeker),
      transitAccess: true,
      waitlistOpen: true,
    },
  ];
}

/** Assign rolling future dates so meetings never stay stuck in the past. */
function withRollingSchedule(meeting: Meeting, index: number, now = new Date()): Meeting {
  const offsetDays = 7 + index * 7;
  const hour = meeting.online ? 14 : 10;
  const day = daysFromToday(offsetDays, now);
  return {
    ...meeting,
    startsAt: toLocalIso(day, hour),
    date: formatMeetingWhen(day, hour),
  };
}

function localizeMeetings(seeker: SeekerLocation, now = new Date()): Meeting[] {
  const agencies = agencyLinksFor(seeker.state);
  const templates: Meeting[] = [
    {
      id: `local-e1-${normalizeId(seeker.city)}`,
      title: `${seeker.city} Reentry Career Workshop`,
      type: "Career workshop",
      date: "Upcoming",
      location: `${agencies.workforceName} — ${seeker.city}`,
      distance: "2.1 mi",
      online: false,
    },
    {
      id: `local-e2-${normalizeId(seeker.city)}`,
      title: "Benefits & SNAP Info Session",
      type: "Benefits workshop",
      date: "Upcoming",
      location: "Online",
      distance: "—",
      online: true,
    },
  ];
  return templates.map((m, i) => withRollingSchedule(m, i, now));
}

function onlyUpcoming(meetings: Meeting[], now = new Date()): Meeting[] {
  return meetings
    .map((m, i) => (m.startsAt ? m : withRollingSchedule(m, i, now)))
    .filter((m) => !m.startsAt || isUpcoming(m.startsAt, now))
    .sort((a, b) => (a.startsAt ?? "").localeCompare(b.startsAt ?? ""));
}

export function jobsForSeeker(seeker: SeekerLocation): Job[] {
  const local = JOBS.filter((job) => locationMatchesMarket(job.location, seeker));
  if (local.length > 0) return local;
  return localizeJobs(seeker);
}

export function resourcesForSeeker(seeker: SeekerLocation): Resource[] {
  const matched = filterLocalThenStatewide(RESOURCES, seeker);
  const hasCityMatch = matched.some((item) => locationMatchesMarket(item.location, seeker));
  if (hasCityMatch) return matched;
  return localizeResources(seeker);
}

export function snapResourcesForSeeker(seeker: SeekerLocation): Resource[] {
  return resourcesForSeeker(seeker).filter((r) => r.category === "SNAP Benefits");
}

export function housingForSeeker(seeker: SeekerLocation): HousingOption[] {
  const withLocation = HOUSING.filter((h) => h.location);
  const local = withLocation.filter((h) => locationMatchesMarket(h.location!, seeker));
  if (local.length > 0) return local;
  return localizeHousing(seeker);
}

export function meetingsForSeeker(seeker: SeekerLocation, now = new Date()): Meeting[] {
  const local = MEETINGS.filter((m) => locationMatchesMarket(m.location, seeker));
  if (local.length > 0) {
    const online = MEETINGS.filter(
      (m) =>
        (m.online || locationMatchesStatewide(m.location, seeker)) &&
        !locationMatchesMarket(m.location, seeker)
    );
    // Online workshops are shared; keep only one SNAP/benefits online session.
    const combined = [...local, ...online.filter((m) => m.online)];
    return onlyUpcoming(combined, now);
  }
  return localizeMeetings(seeker, now);
}

/** Law articles for the seeker's state plus national (US) pieces — never another state's law. */
export function lawArticlesForSeeker(seeker: SeekerLocation): LawArticle[] {
  const code = seeker.state.toUpperCase();
  const matched = LAW_ARTICLES.filter(
    (article) => !article.state || article.state === "US" || article.state === code
  );
  if (matched.some((a) => a.state === code)) return matched;

  // Generic state-named educational stubs when we don't have curated state articles yet.
  const stateLabel = seeker.state.toUpperCase();
  return [
    ...matched,
    {
      id: `law-rights-${code.toLowerCase()}`,
      title: `Rights after a felony conviction in ${stateLabel}`,
      category: "Rights after conviction",
      summary: `Educational overview for ${stateLabel} — not legal advice. Confirm details with a licensed attorney or legal aid.`,
      state: code,
    },
    {
      id: `law-expunge-${code.toLowerCase()}`,
      title: `Record relief / expungement basics in ${stateLabel}`,
      category: "Expungement",
      summary: `General factors that may apply in ${stateLabel}. Eligibility varies — talk to legal aid before filing.`,
      state: code,
    },
  ];
}

/** Dashboard next steps tailored to profile completion and local area. */
export function nextStepsForSeeker(
  seeker: SeekerLocation,
  opts: { completion: number; topJobTitle?: string }
): string[] {
  const remaining = Math.max(0, 100 - opts.completion);
  const steps = [
    remaining > 0
      ? `Complete your profile — ${remaining}% remaining`
      : `Keep your profile current for better matches near ${seeker.city}`,
  ];
  if (opts.topJobTitle) {
    steps.push(`Review and apply to ${opts.topJobTitle} near ${seeker.city}`);
  } else {
    steps.push(`Browse fair-chance jobs near ${seeker.city}, ${seeker.state}`);
  }
  steps.push(`Gather SNAP documents for ${seeker.state} benefits screening`);
  steps.push(`Check upcoming workshops and job fairs near ${seeker.city}`);
  return steps;
}

/** Message previews with relative dates so the inbox never looks stuck in May. */
export function recentMessagesForSeeker(now = new Date()): Message[] {
  return MESSAGES.map((message, index) => ({
    ...message,
    date: relativeDayLabel(index, now),
  }));
}

function relativeDayLabel(daysAgo: number, now: Date): string {
  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  const d = daysFromToday(-daysAgo, now);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Location-aware incentive blurbs for any city/state. */
export function incentivesForSeeker(seeker: SeekerLocation): { title: string; detail: string }[] {
  const agencies = agencyLinksFor(seeker.state);
  return [
    {
      title: "Employment incentives & training grants",
      detail: `Ask ${agencies.workforceName} near ${seeker.city} about WIOA training and reentry job programs.`,
    },
    {
      title: "Federal Work Opportunity Tax Credit (employers)",
      detail: "Employers may get a tax credit for hiring qualifying reentry applicants — useful talking point in interviews.",
    },
    {
      title: "Reentry nonprofit programs",
      detail: `Local nonprofits near ${seeker.city}, ${seeker.state} may offer mentoring, work clothes, or job placement.`,
    },
    {
      title: "Education support & GED scholarships",
      detail: `Adult education and GED options through workforce partners in ${seeker.state}.`,
    },
    {
      title: "Housing deposit assistance",
      detail: `Rental deposit or first-month help may be available via 211 or local housing navigators near ${seeker.city}.`,
    },
    {
      title: "Transportation vouchers",
      detail: `Interview and work-trip vouchers — ask workforce or transit staff near ${seeker.zip || seeker.city}.`,
    },
    {
      title: "Free legal clinic nights",
      detail: `Legal aid clinics in ${seeker.state} for record relief, licenses, and employment questions — not a guarantee of representation.`,
    },
    {
      title: "Sponsored coaching opportunities",
      detail: `Partner programs may cover coaching costs for justice-impacted job seekers in the ${seeker.city} area.`,
    },
  ];
}

/** Transit options named for the seeker's city; known systems when we have them. */
export function transportationForSeeker(
  seeker: SeekerLocation
): { title: string; detail: string }[] {
  const city = seeker.city;
  const key = city.trim().toLowerCase();
  const knownTransit: Record<string, { title: string; detail: string }> = {
    clarksville: {
      title: "Clarksville Transit System (CTS)",
      detail: "Local bus routes for work and interviews across Clarksville",
    },
    nashville: {
      title: "WeGo public transit",
      detail: "WeGo passes and reduced fares where available",
    },
    antioch: {
      title: "WeGo public transit",
      detail: "WeGo passes and reduced fares where available",
    },
    madison: {
      title: "WeGo public transit",
      detail: "WeGo passes and reduced fares where available",
    },
    "bowling green": {
      title: "GO bg Transit",
      detail: "Local bus routes for work and interviews in Bowling Green",
    },
    louisville: {
      title: "TARC public transit",
      detail: "Transit Authority of River City routes for work and interviews",
    },
    lexington: {
      title: "Lextran public transit",
      detail: "Local bus routes for work and interviews in Lexington",
    },
    memphis: {
      title: "MATA public transit",
      detail: "Memphis Area Transit Authority routes for work and interviews",
    },
  };

  const primary = knownTransit[key] ?? {
    title: `${city} public transit`,
    detail: `Local transit and reduced-fare options near ${city}, ${seeker.state}`,
  };

  return [
    primary,
    {
      title: "Workforce transportation",
      detail: `Job search shuttle and career center enrollment near ${city}`,
    },
    {
      title: "Rideshare vouchers",
      detail: "Interview trip vouchers (limited availability — ask workforce staff)",
    },
    {
      title: "Bike programs",
      detail: `Refurbished bikes for work commute in the ${city} area`,
    },
    {
      title: "License reinstatement",
      detail: `Fee waivers and payment plans in ${seeker.state} — see Law Library`,
    },
    {
      title: "Car repair assistance",
      detail: `Nonprofit partner programs by ZIP near ${seeker.zip || city}`,
    },
    {
      title: "Gas card programs",
      detail: "Training or verified employment required",
    },
  ];
}
