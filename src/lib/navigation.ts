export const MOBILE_TABS = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/jobs", label: "Jobs", icon: "briefcase" },
  { href: "/coach", label: "AI Coach", icon: "sparkles" },
  { href: "/resources", label: "Resources", icon: "library" },
  { href: "/messages", label: "Messages", icon: "mail" },
] as const;

export type NavItem = { href: string; label: string };

export const SIDEBAR_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Main",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/jobs", label: "Jobs" },
      { href: "/saved-jobs", label: "Saved Jobs" },
      { href: "/job-fairs", label: "Job Fairs" },
    ],
  },
  {
    title: "Career tools",
    items: [
      { href: "/coach", label: "AI Coach" },
      { href: "/resume", label: "Resume Help" },
      { href: "/cover-letters", label: "Cover Letters" },
      { href: "/interview", label: "Interview Practice" },
    ],
  },
  {
    title: "Resources",
    items: [
      { href: "/resources", label: "Resources" },
      { href: "/snap", label: "SNAP Benefits" },
      { href: "/housing", label: "Housing" },
      { href: "/transportation", label: "Transportation" },
      { href: "/incentives", label: "Local Incentives" },
      { href: "/meetings", label: "AI Meetings" },
      { href: "/law-library", label: "Law Library" },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/messages", label: "Messages" },
      { href: "/subscription", label: "Subscription" },
      { href: "/settings", label: "Settings" },
    ],
  },
];
