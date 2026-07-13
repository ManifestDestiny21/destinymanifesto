export type CompanyProfile = {
  id: string;
  user_id: string;
  company_name: string;
  website: string | null;
  location: string | null;
  description: string | null;
  felon_friendly: boolean;
  created_at: string;
  updated_at: string;
};

/** Database row shape for employer job listings */
export type DbJob = {
  id: string;
  employer_id: string;
  title: string;
  location: string;
  salary_range: string | null;
  description: string;
  felon_friendly: boolean;
  employment_type: string | null;
  schedule: string | null;
  job_category: string | null;
  required_skills: string[] | null;
  preferred_skills: string[] | null;
  ai_summary: string | null;
  ai_tags: string[] | null;
  felony_friendly_rating: number | null;
  ai_enriched_at: string | null;
  created_at: string;
};

export type UserProfile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  about: string | null;
  email: string;
  date_of_birth: string | null;
  phone: string | null;
  phone_visible_to_employers: boolean;
  contact_consent: boolean;
  street_address: string | null;
  city: string | null;
  county: string | null;
  state: string | null;
  zip_code: string | null;
  resume_url: string | null;
  heard_about_us: string | null;
  preferred_name: string | null;
  search_radius_miles: number | null;
  onboarding_completed: boolean;
  profile_data: OnboardingProfileData | null;
  created_at: string;
  updated_at: string;
};

export type OnboardingProfileData = {
  onboarding_step?: number;
  skills?: string;
  work?: string;
  education?: string;
  certs?: string;
  categories?: string;
  pay?: string;
  availability?: string;
  transport?: string;
  housing?: string;
  snap?: string;
  legal?: string;
  coaching?: string;
  restrictions?: string;
  preferred_name?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  search_radius_miles?: number;
  matching_details?: string;
};

// --- Job seeker display types (used in jobs board, cards, resources) ---

export type JobTag =
  | "Felony-friendly"
  | "Background check required"
  | "No CDL"
  | "Housing provided"
  | "Entry level"
  | "Weekly pay"
  | "Training provided"
  | "Transportation accessible"
  | "Second-chance employer"
  | "AI-generated summary";

export type Job = {
  id: string;
  title: string;
  employer: string;
  location: string;
  distance: string;
  payRange: string;
  employmentType: "Full-time" | "Part-time" | "Contract";
  schedule: string;
  aiSummary: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  tags: JobTag[];
  matchScore: number;
  felonyFriendlyRating: 0 | 1 | 2 | 3 | 4 | 5;
  source: string;
  category: string;
  matchReasons: {
    matchedSkills: string[];
    concerns: string[];
    transportation: string;
    backgroundCheck: string;
    nextStep: string;
  };
};

export type Resource = {
  id: string;
  name: string;
  category: string;
  location: string;
  distance: string;
  eligibility: string;
  contact: string;
  link: string;
  aiSummary: string;
};

export type Message = {
  id: string;
  type: "employer" | "coach" | "support" | "draft";
  from: string;
  subject: string;
  preview: string;
  date: string;
  unread: boolean;
};

export type LawArticle = {
  id: string;
  title: string;
  category: string;
  summary: string;
};

export type Meeting = {
  id: string;
  title: string;
  type: string;
  date: string;
  location: string;
  distance: string;
  online: boolean;
};

export type HousingOption = {
  id: string;
  name: string;
  type: string;
  cost: string;
  distance: string;
  acceptsFelony?: boolean;
  transitAccess: boolean;
  waitlistOpen: boolean;
};

export type ApplicationStatus = "saved" | "applied" | "interview" | "offer" | "closed";

export type SavedJob = Job & { applicationStatus: ApplicationStatus; appliedDate?: string };
