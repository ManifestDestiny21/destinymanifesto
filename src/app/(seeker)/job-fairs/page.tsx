import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { AiBadge } from "@/components/ui/ai-badge";
import { requireRole } from "@/lib/auth/guards";
import { getJobSeekerProfile } from "@/lib/user-profile-server";
import { normalizeOnboardingProfile, resolveSeekerLocation } from "@/lib/user-profile";

export default async function JobFairsPage() {
  const { supabase, user } = await requireRole("job_seeker");
  const profileRow = await getJobSeekerProfile(supabase, user.id);
  const profile = profileRow ? normalizeOnboardingProfile(profileRow) : null;
  const seekerLocation = resolveSeekerLocation(profile);

  const fairs = [
    {
      title: `${seekerLocation.city} Reentry Hiring Fair`,
      date: "June 12, 2026 · 10 AM – 2 PM",
      location: `${seekerLocation.city}, ${seekerLocation.state}`,
      note: "AI-generated: Fair-chance employers expected. Bring ID and resume copies.",
    },
    {
      title: "Warehouse & Logistics Job Fair",
      date: "July 8, 2026 · 9 AM – 12 PM",
      location: `Workforce Center — ${seekerLocation.city}`,
      note: "AI-generated: On-site interviews for entry-level roles.",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Job fair notifications"
        subtitle={`Local fairs near ${seekerLocation.label}.`}
      />
      <div className="space-y-4">
        {fairs.map((fair) => (
          <Card key={fair.title}>
            <div className="flex justify-between gap-2">
              <h3 className="font-semibold">{fair.title}</h3>
              <AiBadge />
            </div>
            <p className="mt-2 text-sm text-[#7a7974]">{fair.date}</p>
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
    </div>
  );
}
