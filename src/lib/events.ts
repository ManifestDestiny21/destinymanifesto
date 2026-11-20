import {
  daysFromToday,
  formatFairWindow,
  formatShortDate,
  isUpcoming,
  toLocalIso,
} from "@/lib/dates";
import { locationMatchesMarket, type SeekerLocation } from "@/lib/user-profile";

export type JobFair = {
  id: string;
  title: string;
  /** ISO start — used to hide past fairs automatically */
  startsAt: string;
  /** Display string e.g. "July 25, 2026 · 10 AM – 2 PM" */
  dateLabel: string;
  location: string;
  note: string;
  shortDate: string;
};

type FairTemplate = {
  id: string;
  title: (city: string) => string;
  venue: (city: string, state: string) => string;
  note: string;
  /** Days from today — keeps fairs in the near future without manual edits */
  offsetDays: number;
  startHour: number;
  endHour: number;
};

/**
 * Rolling fair templates. Offsets are relative to "today" so listings
 * never stay stuck on a past month after the date has passed.
 * Templates apply to whatever city/state is on the seeker's profile.
 */
const FAIR_TEMPLATES: FairTemplate[] = [
  {
    id: "reentry-hiring",
    title: (city) => `${city} Reentry Hiring Fair`,
    venue: (city, state) => `${city}, ${state}`,
    note: "Fair-chance employers expected. Bring ID and resume copies. Confirm details with your local American Job Center before you go.",
    offsetDays: 14,
    startHour: 10,
    endHour: 14,
  },
  {
    id: "warehouse-logistics",
    title: () => "Warehouse & Logistics Job Fair",
    venue: (city) => `Workforce Center — ${city}`,
    note: "On-site interviews for entry-level roles. Ask about second-chance / fair-chance employers.",
    offsetDays: 28,
    startHour: 9,
    endHour: 12,
  },
  {
    id: "fair-chance-meetup",
    title: (city) => `${city} Fair-Chance Employer Meetup`,
    venue: (city, state) => `Career Center — ${city}, ${state}`,
    note: "Workforce partners and employers open to justice-impacted applicants. Bring a current resume.",
    offsetDays: 21,
    startHour: 10,
    endHour: 13,
  },
];

function buildFair(template: FairTemplate, seeker: SeekerLocation, now = new Date()): JobFair {
  const day = daysFromToday(template.offsetDays, now);
  const startsAt = toLocalIso(day, template.startHour);
  return {
    id: `${template.id}-${seeker.city.toLowerCase().replace(/\s+/g, "-")}`,
    title: template.title(seeker.city),
    startsAt,
    dateLabel: formatFairWindow(day, template.startHour, template.endHour),
    location: template.venue(seeker.city, seeker.state),
    note: template.note,
    shortDate: formatShortDate(day),
  };
}

/** Upcoming job fairs for the seeker's city/state. Past dates are excluded automatically. */
export function upcomingJobFairs(seeker: SeekerLocation, now = new Date()): JobFair[] {
  return FAIR_TEMPLATES.map((t) => buildFair(t, seeker, now))
    .filter((fair) => isUpcoming(fair.startsAt, now))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/** Next fair for dashboard teaser, or null if none. */
export function nextJobFair(seeker: SeekerLocation, now = new Date()): JobFair | null {
  return upcomingJobFairs(seeker, now)[0] ?? null;
}

/** Filter any list that has startsAt / location by upcoming + local market. */
export function filterUpcomingLocal<T extends { startsAt?: string; location: string }>(
  items: T[],
  seeker: SeekerLocation,
  now = new Date()
): T[] {
  return items.filter((item) => {
    if (item.startsAt && !isUpcoming(item.startsAt, now)) return false;
    return locationMatchesMarket(item.location, seeker) || item.location.toLowerCase() === "online";
  });
}
