import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { AiBadge } from "@/components/ui/ai-badge";
import { requireRole } from "@/lib/auth/guards";
import { upcomingJobFairs } from "@/lib/events";
import { getJobSeekerProfile } from "@/lib/user-profile-server";
import { normalizeOnboardingProfile, resolveSeekerLocation } from "@/lib/user-profile";

export default async function JobFairsPage() {
  const { supabase, user } = await requireRole("job_seeker");
  const profileRow = await getJobSeekerProfile(supabase, user.id);
  const profile = profileRow ? normalizeOnboardingProfile(profileRow) : null;
  const seekerLocation = resolveSeekerLocation(profile);
  const fairs = upcomingJobFairs(seekerLocation);

  return (
    <div>
      <PageHeader
        title="Job fair notifications"
        subtitle={`Upcoming fairs near ${seekerLocation.label}. Past dates are hidden automatically.`}
      />
      {fairs.length === 0 ? (
        <Card>
          <h3 className="font-semibold">No upcoming job fairs listed yet</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#7a7974]">
            Check your local American Job Center or workforce office for fair-chance hiring events
            near {seekerLocation.city}, {seekerLocation.state}. We only show dates that are still
            upcoming.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {fairs.map((fair) => (
            <Card key={fair.id}>
              <div className="flex justify-between gap-2">
                <h3 className="font-semibold">{fair.title}</h3>
                <AiBadge />
              </div>
              <p className="mt-2 text-sm text-[#7a7974]">{fair.dateLabel}</p>
              <p className="text-sm">{fair.location}</p>
              <p className="mt-2 text-sm leading-relaxed">{fair.note}</p>
              <button
                type="button"
                className="mt-3 rounded-xl border border-[#b8860b]/40 bg-[#b8860b]/10 px-3 py-1.5 text-xs font-semibold text-[#964219]"
              >
                Add reminder
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
