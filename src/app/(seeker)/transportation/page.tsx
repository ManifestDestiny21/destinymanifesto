import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { AiBadge } from "@/components/ui/ai-badge";
import { requireRole } from "@/lib/auth/guards";
import { transportationForSeeker } from "@/lib/local-content";
import { getJobSeekerProfile } from "@/lib/user-profile-server";
import { normalizeOnboardingProfile, resolveSeekerLocation } from "@/lib/user-profile";

export default async function TransportationPage() {
  const { supabase, user } = await requireRole("job_seeker");
  const profileRow = await getJobSeekerProfile(supabase, user.id);
  const profile = profileRow ? normalizeOnboardingProfile(profileRow) : null;
  const seekerLocation = resolveSeekerLocation(profile);
  const options = transportationForSeeker(seekerLocation);

  return (
    <div>
      <PageHeader
        title="Transportation resources"
        subtitle={`Get to work, interviews, and appointments near ${seekerLocation.label}.`}
      />
      <div className="space-y-3">
        {options.map((opt) => (
          <Card key={opt.title}>
            <div className="flex justify-between gap-2">
              <h3 className="font-semibold">{opt.title}</h3>
              <AiBadge />
            </div>
            <p className="mt-1 text-sm text-[#7a7974]">{opt.detail}</p>
            <p className="mt-2 text-xs italic text-[#7a7974]">
              AI-generated summary — verify eligibility with the provider.
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
