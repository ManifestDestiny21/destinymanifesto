import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/settings-form";
import { requireRole } from "@/lib/auth/guards";
import { bootstrapJobSeekerProfile } from "@/lib/user-profile-server";
import { normalizeOnboardingProfile } from "@/lib/user-profile";
import Link from "next/link";

export default async function SettingsPage() {
  const { supabase, user } = await requireRole("job_seeker");

  const { profile, error } = await bootstrapJobSeekerProfile(supabase, user.id);

  if (!profile) {
    return (
      <div>
        <PageHeader title="Settings" subtitle="You control what you share." />
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error ?? "Could not load your profile."} Run{" "}
          the database migrations (<code className="text-xs">supabase/README.md</code>), then{" "}
          <Link href="/settings" className="font-medium underline">
            try again
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="You control what you share." />
      <SettingsForm profile={normalizeOnboardingProfile(profile)} />
    </div>
  );
}
