import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ResourceCard } from "@/components/resource-card";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import { resourcesForSeeker } from "@/lib/local-content";
import { getJobSeekerProfile } from "@/lib/user-profile-server";
import { normalizeOnboardingProfile, resolveSeekerLocation } from "@/lib/user-profile";

const CATEGORIES = [
  { name: "SNAP Benefits", href: "/snap" },
  { name: "Housing", href: "/housing" },
  { name: "Transportation", href: "/transportation" },
  { name: "Local Incentives", href: "/incentives" },
  { name: "AI Meetings", href: "/meetings" },
  { name: "Law Library", href: "/law-library" },
  { name: "Coaching", href: "/coach" },
  { name: "Job Fairs", href: "/job-fairs" },
  { name: "Book", href: "/book" },
];

export default async function ResourcesPage() {
  const { supabase, user } = await requireRole("job_seeker");
  const profileRow = await getJobSeekerProfile(supabase, user.id);
  const profile = profileRow ? normalizeOnboardingProfile(profileRow) : null;
  const seekerLocation = resolveSeekerLocation(profile);
  const resources = resourcesForSeeker(seekerLocation);

  return (
    <div>
      <PageHeader
        title="Resources hub"
        subtitle={`Local support near ${seekerLocation.label}.`}
      />
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <Link key={cat.href} href={cat.href}>
            <Card className="text-center transition hover:border-[#01696f]/40">
              <span className="text-sm font-semibold">{cat.name}</span>
            </Card>
          </Link>
        ))}
      </div>
      <h2 className="mb-3 font-semibold">
        Near you — {seekerLocation.city}, {seekerLocation.state}
      </h2>
      <div className="space-y-4">
        {resources.map((r) => (
          <ResourceCard key={r.id} resource={r} />
        ))}
      </div>
    </div>
  );
}
