import { PageHeader } from "@/components/page-header";
import { HousingList } from "@/components/housing-list";
import { requireRole } from "@/lib/auth/guards";
import { getJobSeekerProfile } from "@/lib/user-profile-server";
import { HOUSING } from "@/lib/mock-data";
import { normalizeOnboardingProfile, resolveSeekerLocation } from "@/lib/user-profile";

export default async function HousingPage() {
  const { supabase, user } = await requireRole("job_seeker");
  const profileRow = await getJobSeekerProfile(supabase, user.id);
  const profile = profileRow ? normalizeOnboardingProfile(profileRow) : null;
  const seekerLocation = resolveSeekerLocation(profile);

  return (
    <div>
      <PageHeader
        title="Housing resources"
        subtitle={`Transitional, reentry, sober living, shelters, and rental help near ${seekerLocation.label}.`}
      />
      <HousingList options={HOUSING} />
    </div>
  );
}
