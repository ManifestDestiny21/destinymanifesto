import { PageHeader } from "@/components/page-header";
import { ResourceCard } from "@/components/resource-card";
import { Card } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/disclaimer";
import { AiBadge } from "@/components/ui/ai-badge";
import { requireRole } from "@/lib/auth/guards";
import { agencyLinksFor, snapResourcesForSeeker } from "@/lib/local-content";
import { getJobSeekerProfile } from "@/lib/user-profile-server";
import { normalizeOnboardingProfile, resolveSeekerLocation } from "@/lib/user-profile";

const DOCUMENTS = [
  "Photo ID",
  "Proof of income (pay stubs or employer letter)",
  "Proof of address",
  "Social Security numbers for household members",
  "Expense information (rent, utilities)",
];

export default async function SnapPage() {
  const { supabase, user } = await requireRole("job_seeker");
  const profileRow = await getJobSeekerProfile(supabase, user.id);
  const profile = profileRow ? normalizeOnboardingProfile(profileRow) : null;
  const seekerLocation = resolveSeekerLocation(profile);
  const snapResources = snapResourcesForSeeker(seekerLocation);
  const agencies = agencyLinksFor(seekerLocation.state);

  return (
    <div>
      <PageHeader
        title="SNAP benefits"
        subtitle={`Guidance for ${seekerLocation.city}, ${seekerLocation.state}`}
      />
      <Disclaimer variant="legal" className="mb-4">
        This is guidance only. The agency decides eligibility.
      </Disclaimer>
      <Card className="mb-4">
        <p className="text-sm">
          <strong>Your location:</strong> {seekerLocation.label}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[#7a7974]">
          AI-generated: {agencies.snapBlurb}
        </p>
        <AiBadge className="mt-2" />
      </Card>
      <Card className="mb-6">
        <h2 className="font-semibold">Required documents checklist</h2>
        <ul className="mt-3 space-y-2">
          {DOCUMENTS.map((doc) => (
            <li key={doc} className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded border-[#7a7974]/40" />
              {doc}
            </li>
          ))}
        </ul>
      </Card>
      <h2 className="mb-3 font-semibold">Local SNAP offices</h2>
      <div className="space-y-4">
        {snapResources.map((r) => (
          <ResourceCard key={r.id} resource={r} />
        ))}
      </div>
    </div>
  );
}
