import { PageHeader } from "@/components/page-header";
import { LawLibraryClient } from "@/components/law-library-client";
import { requireRole } from "@/lib/auth/guards";
import { getJobSeekerProfile } from "@/lib/user-profile-server";
import { LAW_ARTICLES, LAW_CATEGORIES } from "@/lib/mock-data";
import { normalizeOnboardingProfile, resolveSeekerLocation } from "@/lib/user-profile";

export default async function LawLibraryPage() {
  const { supabase, user } = await requireRole("job_seeker");
  const profileRow = await getJobSeekerProfile(supabase, user.id);
  const profile = profileRow ? normalizeOnboardingProfile(profileRow) : null;
  const seekerLocation = resolveSeekerLocation(profile);

  return (
    <div>
      <PageHeader
        title="Law library"
        subtitle={`Educational information for ${seekerLocation.state} — not legal advice.`}
      />
      <LawLibraryClient articles={LAW_ARTICLES} categories={LAW_CATEGORIES} />
    </div>
  );
}
