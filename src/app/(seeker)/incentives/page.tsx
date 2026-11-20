import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { AiBadge } from "@/components/ui/ai-badge";
import { requireRole } from "@/lib/auth/guards";
import { incentivesForSeeker } from "@/lib/local-content";
import { getJobSeekerProfile } from "@/lib/user-profile-server";
import { normalizeOnboardingProfile, resolveSeekerLocation } from "@/lib/user-profile";

export default async function IncentivesPage() {
  const { supabase, user } = await requireRole("job_seeker");
  const profileRow = await getJobSeekerProfile(supabase, user.id);
  const profile = profileRow ? normalizeOnboardingProfile(profileRow) : null;
  const seekerLocation = resolveSeekerLocation(profile);
  const incentives = incentivesForSeeker(seekerLocation);

  return (
    <div>
      <PageHeader
        title="Local incentives"
        subtitle={`Programs that may support your next chapter near ${seekerLocation.label}.`}
      />
      <div className="space-y-3">
        {incentives.map((item) => (
          <Card key={item.title} className="border-[#b8860b]/20">
            <div className="flex justify-between gap-2">
              <h3 className="font-semibold text-[#964219]">{item.title}</h3>
              <AiBadge />
            </div>
            <p className="mt-1 text-sm text-[#7a7974]">{item.detail}</p>
            <p className="mt-2 text-xs text-[#7a7974]">
              Programs vary by ZIP and eligibility. This is not a guarantee of approval.
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
