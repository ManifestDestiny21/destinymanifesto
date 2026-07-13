import type { HousingOption, Job, LawArticle, Meeting, Message, Resource, SavedJob } from "./types";

/** Default market for demo content when a profile location is not set yet. */
export const DEMO_USER = {
  preferredName: "Jordan",
  city: "Nashville",
  state: "TN",
  zip: "37203",
  profileCompletion: 72,
  trialDaysLeft: 87,
};

export const JOBS: Job[] = [
  {
    id: "1",
    title: "Warehouse Associate",
    employer: "Second Chance Logistics",
    location: "Nashville, TN",
    distance: "3.2 mi",
    payRange: "$17–$19/hr",
    employmentType: "Full-time",
    schedule: "Mon–Fri, day shift",
    aiSummary:
      "AI-generated: Entry-level warehouse role with on-site training. Employer lists fair-chance hiring and no CDL required.",
    description:
      "Pick, pack, and load shipments. Lift up to 50 lbs. Steel-toe boots provided after 30 days. Weekly pay available.",
    requiredSkills: ["Reliable attendance", "Basic math"],
    preferredSkills: ["Forklift experience"],
    tags: [
      "Felony-friendly",
      "Entry level",
      "Weekly pay",
      "Training provided",
      "Transportation accessible",
      "Second-chance employer",
      "No CDL",
      "AI-generated summary",
    ],
    matchScore: 92,
    felonyFriendlyRating: 5,
    source: "Destiny Manifesto",
    category: "Warehouse",
    matchReasons: {
      matchedSkills: ["Warehouse experience", "Reliable attendance"],
      concerns: ["Background check required for final offer"],
      transportation: "Near WeGo transit routes — matches your transit access",
      backgroundCheck: "Required after conditional offer",
      nextStep: "Apply today and prepare 2 work references",
    },
  },
  {
    id: "2",
    title: "Line Cook",
    employer: "Music City Kitchen Co.",
    location: "Nashville, TN",
    distance: "5.8 mi",
    payRange: "$15–$17/hr",
    employmentType: "Part-time",
    schedule: "Evenings and weekends",
    aiSummary:
      "AI-generated: Food service role with flexible hours. Felony-friendly likelihood uncertain — verify with hiring manager.",
    description:
      "Prep ingredients, operate grill, maintain clean station. Food handler card training provided.",
    requiredSkills: ["Kitchen safety basics"],
    preferredSkills: ["Line experience"],
    tags: ["Entry level", "Training provided", "Background check required", "AI-generated summary"],
    matchScore: 78,
    felonyFriendlyRating: 3,
    source: "Indeed (aggregated)",
    category: "Food Service",
    matchReasons: {
      matchedSkills: ["Food prep", "Teamwork"],
      concerns: ["Evening schedule may conflict with probation check-ins"],
      transportation: "About 15 min by bus; rideshare support may help",
      backgroundCheck: "Standard background check",
      nextStep: "Call to ask about conviction-related restrictions before applying",
    },
  },
  {
    id: "3",
    title: "Maintenance Technician",
    employer: "Cumberland Property Group",
    location: "Murfreesboro, TN",
    distance: "14 mi",
    payRange: "$20–$24/hr",
    employmentType: "Full-time",
    schedule: "Rotating on-call",
    aiSummary:
      "AI-generated: Skilled maintenance role. Housing not provided. Higher pay — license restrictions may apply.",
    description:
      "HVAC basics, plumbing repairs, unit turns. Company vehicle for on-site visits.",
    requiredSkills: ["HVAC basics", "Valid driver's license"],
    preferredSkills: ["EPA certification"],
    tags: ["Background check required", "No CDL", "AI-generated summary"],
    matchScore: 65,
    felonyFriendlyRating: 2,
    source: "LinkedIn (aggregated)",
    category: "Skilled Trades",
    matchReasons: {
      matchedSkills: ["Maintenance", "Problem solving"],
      concerns: ["Driver's license reinstatement in progress", "Distance without car"],
      transportation: "Limited transit — consider carpool or workforce transport",
      backgroundCheck: "Driving record and criminal background check",
      nextStep: "Complete license reinstatement resources first",
    },
  },
  {
    id: "4",
    title: "Customer Service Associate",
    employer: "Volunteer State Staffing",
    location: "Antioch, TN",
    distance: "8.1 mi",
    payRange: "$16–$18/hr",
    employmentType: "Full-time",
    schedule: "Day shift, rotating weekends",
    aiSummary:
      "AI-generated: Fair-chance customer service role with paid training. Good fit for dependable attendance.",
    description:
      "Answer phones, assist walk-in guests, and update schedules. Soft skills and reliability valued.",
    requiredSkills: ["Customer service", "Reliable attendance"],
    preferredSkills: ["Bilingual English/Spanish"],
    tags: ["Felony-friendly", "Entry level", "Training provided", "Second-chance employer"],
    matchScore: 85,
    felonyFriendlyRating: 4,
    source: "Destiny Manifesto",
    category: "Customer Service",
    matchReasons: {
      matchedSkills: ["Customer service", "Communication"],
      concerns: ["Weekend rotation may need approval"],
      transportation: "On a WeGo-adjacent corridor",
      backgroundCheck: "Standard check after offer",
      nextStep: "Apply and note availability in your cover note",
    },
  },
];

export const SAVED_JOBS: SavedJob[] = [
  { ...JOBS[0], applicationStatus: "applied", appliedDate: "May 20, 2026" },
  { ...JOBS[1], applicationStatus: "saved" },
];

export const RESOURCES: Resource[] = [
  {
    id: "r1",
    name: "Tennessee DHS SNAP / One DHS",
    category: "SNAP Benefits",
    location: "Nashville, TN",
    distance: "2.1 mi",
    eligibility: "Income and household size based",
    contact: "Online or local DHS office",
    link: "https://www.tn.gov/humanservices/for-families/supplemental-nutrition-assistance-program-snap.html",
    aiSummary: "AI-generated: Tennessee SNAP applications and case info through DHS / One DHS.",
  },
  {
    id: "r2",
    name: "Room In The Inn — Nashville",
    category: "Housing",
    location: "Nashville, TN",
    distance: "4.5 mi",
    eligibility: "Returning citizens; program policies apply",
    contact: "Intake coordinator",
    link: "https://www.roomintheinn.org",
    aiSummary: "AI-generated: Shelter and recovery support with pathways to stability.",
  },
  {
    id: "r3",
    name: "WeGo Transit Job Access Pass",
    category: "Transportation",
    location: "Nashville, TN",
    distance: "1.8 mi",
    eligibility: "Active job search or training participants",
    contact: "Career center desk",
    link: "https://www.wegotransit.com",
    aiSummary: "AI-generated: Local transit options for getting to interviews and work.",
  },
];

export const MESSAGES: Message[] = [
  {
    id: "m1",
    type: "employer",
    from: "Second Chance Logistics",
    subject: "Application received",
    preview: "Thank you for applying to Warehouse Associate...",
    date: "May 22",
    unread: true,
  },
  {
    id: "m2",
    type: "coach",
    from: "Reentry Coach Maria",
    subject: "Weekly check-in",
    preview: "How did the application steps go this week?",
    date: "May 21",
    unread: false,
  },
  {
    id: "m3",
    type: "draft",
    from: "AI draft",
    subject: "Follow-up: Warehouse Associate",
    preview: "AI-generated: Polite follow-up message draft ready for your review.",
    date: "May 20",
    unread: false,
  },
];

export const LAW_ARTICLES: LawArticle[] = [
  {
    id: "l1",
    title: "Rights after a felony conviction in Tennessee",
    category: "Rights after conviction",
    summary: "Educational overview of employment, housing, and voting considerations.",
  },
  {
    id: "l2",
    title: "Understanding background checks for jobs",
    category: "Background checks",
    summary: "What employers may ask, timing of checks, and your right to accurate records.",
  },
  {
    id: "l3",
    title: "Expungement basics in Tennessee",
    category: "Expungement",
    summary: "General eligibility factors — not a substitute for legal advice.",
  },
  {
    id: "l4",
    title: "Driver's license reinstatement",
    category: "Driver's license reinstatement",
    summary: "Steps, fees, and reinstatement programs that may apply in Tennessee.",
  },
];

export const MEETINGS: Meeting[] = [
  {
    id: "e1",
    title: "Reentry Career Workshop",
    type: "Career workshop",
    date: "May 28, 10:00 AM",
    location: "Nashville Career Advancement Center",
    distance: "2.4 mi",
    online: false,
  },
  {
    id: "e2",
    title: "Benefits & SNAP Info Session",
    type: "Benefits workshop",
    date: "May 30, 2:00 PM",
    location: "Online",
    distance: "—",
    online: true,
  },
];

export const HOUSING: HousingOption[] = [
  {
    id: "h1",
    name: "Room In The Inn Housing Path",
    type: "Transitional housing",
    cost: "Sliding scale",
    distance: "4.5 mi",
    acceptsFelony: true,
    transitAccess: true,
    waitlistOpen: true,
  },
  {
    id: "h2",
    name: "Serenity Sober Living — Middle TN",
    type: "Sober living",
    cost: "$650/mo",
    distance: "6.2 mi",
    acceptsFelony: true,
    transitAccess: false,
    waitlistOpen: false,
  },
  {
    id: "h3",
    name: "Family Promise of Nashville",
    type: "Shelter",
    cost: "Free (short-term)",
    distance: "3.1 mi",
    transitAccess: true,
    waitlistOpen: true,
  },
];

export const FELONY_RATING_LABELS: Record<number, string> = {
  0: "Less likely felony-friendly",
  1: "Low likelihood",
  2: "Uncertain",
  3: "Possible fit",
  4: "Likely felony-friendly",
  5: "Higher probability felony-friendly",
};

export const ONBOARDING_STEPS = [
  { id: "name", title: "What should we call you?", optional: false },
  { id: "location", title: "Where are you looking for work?", optional: false },
  { id: "radius", title: "How far can you travel?", optional: false },
  { id: "skills", title: "Your skills", optional: true },
  { id: "work", title: "Work history", optional: true },
  { id: "education", title: "Education", optional: true },
  { id: "certs", title: "Certifications", optional: true },
  { id: "categories", title: "Job categories you want", optional: false },
  { id: "pay", title: "Target pay", optional: true },
  { id: "availability", title: "Availability", optional: false },
  { id: "transport", title: "Transportation", optional: false },
  { id: "housing", title: "Housing needs", optional: true },
  { id: "snap", title: "SNAP or benefits", optional: true },
  { id: "legal", title: "Legal information needs", optional: true },
  { id: "coaching", title: "Coaching needs", optional: true },
  { id: "restrictions", title: "Job matching details (optional)", optional: true },
];

export const NEXT_STEPS = [
  "Complete your profile — 28% remaining",
  "Apply to Warehouse Associate (92% match)",
  "Upload ID for SNAP pre-screening checklist",
  "Review AI-generated cover letter draft",
];

export const LAW_CATEGORIES = [
  "Rights after conviction",
  "Background checks",
  "Employment restrictions",
  "Expungement",
  "Pardons",
  "Voting rights",
  "Housing rights",
  "Driver's license reinstatement",
  "Parole/probation basics",
  "Family and child support",
  "Legal aid directory",
];
