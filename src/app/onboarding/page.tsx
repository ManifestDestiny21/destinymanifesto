import Link from "next/link";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { requireRole } from "@/lib/auth/guards";
import { bootstrapJobSeekerProfile } from "@/lib/user-profile-server";
import { normalizeOnboardingProfile } from "@/lib/user-profile";

function OnboardingSetupError({ detail }: { detail?: string }) {
  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-2xl font-semibold text-[#28251d]">Could not start onboarding</h1>
      <p className="mt-3 text-sm text-[#7a7974]">
        You are signed in, but Supabase could not create your profile row yet.
      </p>
      {detail ? (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {detail}
        </p>
      ) : null}
      <p className="mt-4 text-sm text-[#7a7974]">
        Open Supabase → SQL Editor → run the file{" "}
        <code className="text-xs">supabase/fix-onboarding.sql</code> in this project, then refresh
        this page.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/onboarding"
          className="rounded-xl bg-[#01696f] px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </Link>
        <Link href="/dashboard" className="rounded-xl border px-4 py-2 text-sm font-medium">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}

export default async function OnboardingPage() {
  const { supabase, user } = await requireRole("job_seeker");

  const { profile, error } = await bootstrapJobSeekerProfile(supabase, user.id);

  if (!profile) {
    return <OnboardingSetupError detail={error} />;
  }

  return <OnboardingFlow profile={normalizeOnboardingProfile(profile)} />;
}
