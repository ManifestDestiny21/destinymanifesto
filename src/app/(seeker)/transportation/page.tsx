import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { AiBadge } from "@/components/ui/ai-badge";
import { requireRole } from "@/lib/auth/guards";
import { getJobSeekerProfile } from "@/lib/user-profile-server";
import { normalizeOnboardingProfile, resolveSeekerLocation } from "@/lib/user-profile";

export default async function TransportationPage() {
  const { supabase, user } = await requireRole("job_seeker");
  const profileRow = await getJobSeekerProfile(supabase, user.id);
  const profile = profileRow ? normalizeOnboardingProfile(profileRow) : null;
  const seekerLocation = resolveSeekerLocation(profile);
  const city = seekerLocation.city;
  const isClarksville = city.toLowerCase().includes("clarksville");
  const isNashville =
    city.toLowerCase().includes("nashville") ||
    ["antioch", "madison", "goodlettsville"].includes(city.toLowerCase());

  const OPTIONS = [
    {
      title: isClarksville ? "Clarksville Transit System (CTS)" : isNashville ? "WeGo public transit" : `${city} public transit`,
      detail: isClarksville
        ? "Local bus routes for work and interviews across Clarksville"
        : isNashville
          ? "WeGo passes and reduced fares where available"
          : `Local transit and reduced-fare options near ${city}`,
    },
    {
      title: "Workforce transportation",
      detail: `Job search shuttle and career center enrollment near ${city}`,
    },
    {
      title: "Rideshare vouchers",
      detail: "Interview trip vouchers (limited availability — ask workforce staff)",
    },
    {
      title: "Bike programs",
      detail: `Refurbished bikes for work commute in the ${city} area`,
    },
    {
      title: "License reinstatement",
      detail: "Fee waivers and payment plans — see Law Library",
    },
    {
      title: "Car repair assistance",
      detail: `Nonprofit partner programs by ZIP near ${seekerLocation.zip || city}`,
    },
    {
      title: "Gas card programs",
      detail: "Training or verified employment required",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Transportation resources"
        subtitle={`Get to work, interviews, and appointments near ${seekerLocation.label}.`}
      />
      <div className="space-y-3">
        {OPTIONS.map((opt) => (
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
