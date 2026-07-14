import { HOUSING, JOBS, MEETINGS, RESOURCES } from "@/lib/mock-data";
import type { HousingOption, Job, Meeting, Resource } from "@/lib/types";
import {
  filterLocalThenStatewide,
  locationMatchesMarket,
  locationMatchesStatewide,
  type SeekerLocation,
} from "@/lib/user-profile";

function cityStateLabel(seeker: SeekerLocation): string {
  return `${seeker.city}, ${seeker.state}`;
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
  const localTemplates: Resource[] = [
    {
      id: `local-snap-${normalizeId(seeker.city)}`,
      name: `${seeker.city} DHS / SNAP assistance`,
      category: "SNAP Benefits",
      location: cityStateLabel(seeker),
      distance: "2.0 mi",
      eligibility: "Income and household size based",
      contact: "Local DHS / human services office",
      link: "https://www.tn.gov/humanservices/for-families/supplemental-nutrition-assistance-program-snap.html",
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
      link: "https://www.tn.gov",
      aiSummary: `AI-generated: Local transit and rideshare options for interviews and work near ${seeker.city}.`,
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

function localizeMeetings(seeker: SeekerLocation): Meeting[] {
  return [
    {
      id: `local-e1-${normalizeId(seeker.city)}`,
      title: `${seeker.city} Reentry Career Workshop`,
      type: "Career workshop",
      date: "May 28, 10:00 AM",
      location: `${seeker.city} Career / Workforce Center`,
      distance: "2.1 mi",
      online: false,
    },
    {
      id: `local-e2-${normalizeId(seeker.city)}`,
      title: "Benefits & SNAP Info Session",
      type: "Benefits workshop",
      date: "May 30, 2:00 PM",
      location: "Online",
      distance: "—",
      online: true,
    },
  ];
}

function normalizeId(city: string): string {
  return city.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "local";
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
  const local = withLocation.filter((h) => locationMatchesMarket(h.location, seeker));
  if (local.length > 0) return local;
  return localizeHousing(seeker);
}

export function meetingsForSeeker(seeker: SeekerLocation): Meeting[] {
  const local = MEETINGS.filter((m) => locationMatchesMarket(m.location, seeker));
  if (local.length > 0) {
    const online = MEETINGS.filter(
      (m) =>
        locationMatchesStatewide(m.location, seeker) &&
        !locationMatchesMarket(m.location, seeker)
    );
    return [...local, ...online];
  }
  return localizeMeetings(seeker);
}
