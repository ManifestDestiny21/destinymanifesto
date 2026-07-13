import { PageHeader } from "@/components/page-header";
import { MeetingsList } from "@/components/meetings-list";
import { requireRole } from "@/lib/auth/guards";
import { getJobSeekerProfile } from "@/lib/user-profile-server";
import { MEETINGS } from "@/lib/mock-data";
import { normalizeOnboardingProfile, resolveSeekerLocation } from "@/lib/user-profile";

export default async function MeetingsPage() {
  const { supabase, user } = await requireRole("job_seeker");
  const profileRow = await getJobSeekerProfile(supabase, user.id);
  const profile = profileRow ? normalizeOnboardingProfile(profileRow) : null;
  const seekerLocation = resolveSeekerLocation(profile);

  return (
    <div>
      <PageHeader
        title="AI Meetings & events"
        subtitle={`Support groups, workshops, clinics, and mentorship near ${seekerLocation.label}.`}
      />
      <MeetingsList meetings={MEETINGS} />
    </div>
  );
}
