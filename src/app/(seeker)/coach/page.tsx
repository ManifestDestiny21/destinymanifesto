import { PageHeader } from "@/components/page-header";
import { AiToolForm } from "@/components/ai-tool-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AiBadge } from "@/components/ui/ai-badge";
import { requireRole } from "@/lib/auth/guards";
import { getJobSeekerProfile } from "@/lib/user-profile-server";
import { normalizeOnboardingProfile, resolveSeekerLocation } from "@/lib/user-profile";

const PACKAGES = [
  { days: 30, label: "30-day coaching package", focus: "Job search kickoff" },
  { days: 60, label: "60-day coaching package", focus: "Applications & interviews" },
  { days: 90, label: "90-day coaching package", focus: "Stability & next chapter" },
];

export default async function CoachPage() {
  const { supabase, user } = await requireRole("job_seeker");
  const profileRow = await getJobSeekerProfile(supabase, user.id);
  const profile = profileRow ? normalizeOnboardingProfile(profileRow) : null;
  const seekerLocation = resolveSeekerLocation(profile);

  const weeklyGoals = [
    `Apply to 3 fair-chance matches near ${seekerLocation.city}`,
    `Complete SNAP document checklist for ${seekerLocation.state}`,
    "Practice 2 interview questions",
  ];

  return (
    <div>
      <PageHeader
        title="AI Coach & coaching"
        subtitle={`Accountability and next steps near ${seekerLocation.label}.`}
      />
      <Card className="mb-6">
        <h2 className="font-semibold">This week&apos;s goals</h2>
        <ul className="mt-2 list-inside list-disc text-sm text-[#7a7974]">
          {weeklyGoals.map((goal) => (
            <li key={goal}>{goal}</li>
          ))}
        </ul>
        <div className="mt-3 h-2 rounded-full bg-[#7a7974]/20">
          <div className="h-full w-2/3 rounded-full bg-[#437a22]" />
        </div>
        <p className="mt-1 text-xs text-[#7a7974]">Progress tracker · update as you go</p>
      </Card>
      <AiToolForm
        title="AI next-step plan"
        description={`Create your next step for this week near ${seekerLocation.city}.`}
        placeholder="What is your main goal this week?"
        generateLabel="Generate plan"
        sampleOutput={`AI-generated weekly plan for: {input}

1. Monday: Update resume bullets for a top match near ${seekerLocation.city}
2. Tuesday: Submit 1 application with cover letter review
3. Wednesday: ${seekerLocation.state} SNAP office call — confirm documents
4. Thursday: Interview practice (15 min)
5. Friday: Check in with coach or AI Coach`}
      />
      <section className="mt-8">
        <h2 className="mb-3 font-semibold">Coaching packages</h2>
        <div className="space-y-3">
          {PACKAGES.map((pkg) => (
            <Card key={pkg.days}>
              <div className="flex justify-between">
                <h3 className="font-semibold">{pkg.label}</h3>
                <AiBadge />
              </div>
              <p className="mt-1 text-sm text-[#7a7974]">{pkg.focus}</p>
              <Button className="mt-3" variant="secondary">
                Learn more
              </Button>
            </Card>
          ))}
        </div>
        <Card className="mt-4 border-[#b8860b]/30 bg-[#b8860b]/8">
          <p className="text-sm font-medium text-[#964219]">Need sponsored coaching?</p>
          <p className="mt-1 text-sm text-[#7a7974]">
            Request free or sponsored coaching through partner programs near{" "}
            {seekerLocation.city}, {seekerLocation.state}.
          </p>
          <Button className="mt-3" variant="secondary">
            Request sponsored coaching
          </Button>
        </Card>
      </section>
    </div>
  );
}
