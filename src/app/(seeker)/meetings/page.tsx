import { PageHeader } from "@/components/page-header";
import { MeetingsList } from "@/components/meetings-list";
import { requireRole } from "@/lib/auth/guards";
import { meetingsForSeeker } from "@/lib/local-content";
import { getJobSeekerProfile } from "@/lib/user-profile-server";
import { normalizeOnboardingProfile, resolveSeekerLocation } from "@/lib/user-profile";

export default async function MeetingsPage() {
  const { supabase, user } = await requireRole("job_seeker");
  const profileRow = await getJobSeekerProfile(supabase, user.id);
  const profile = profileRow ? normalizeOnboardingProfile(profileRow) : null;
  const seekerLocation = resolveSeekerLocation(profile);
  const meetings = meetingsForSeeker(seekerLocation);

  return (
    <div>
      <PageHeader
        title="AI Meetings & events"
        subtitle={`Upcoming support groups, workshops, and mentorship near ${seekerLocation.label}. Past events are hidden automatically.`}
      />
      {meetings.length === 0 ? (
        <p className="rounded-2xl border border-[#7a7974]/15 bg-[#fbfbf9] px-4 py-6 text-sm text-[#7a7974]">
          No upcoming meetings listed near {seekerLocation.city} yet. Check your local workforce
          center or call 211 for recovery and reentry groups in {seekerLocation.state}.
        </p>
      ) : (
        <MeetingsList meetings={meetings} />
      )}
    </div>
  );
}
