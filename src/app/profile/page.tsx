import Link from "next/link";
import { CompanyProfileForm } from "@/components/company-profile-form";
import { CompanyProfile } from "@/lib/types";
import { requireRole } from "@/lib/auth/guards";
import { hasCompleteCompanyProfile } from "@/lib/employer/company-profile";

type Props = {
  searchParams: Promise<{ setup?: string }>;
};

export default async function ProfilePage({ searchParams }: Props) {
  const { setup } = await searchParams;
  const { supabase, user } = await requireRole("employer");

  const { data, error } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const profile = (data as CompanyProfile | null) ?? null;
  const setupRequired = setup === "required" || !hasCompleteCompanyProfile(profile);

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <div className="mb-4">
        <Link href="/employer/dashboard" className="text-sm text-blue-600">
          Back to dashboard
        </Link>
      </div>
      {setupRequired ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Complete your company profile before posting jobs. Job seekers will see your company name
          on listings.
        </div>
      ) : null}
      <CompanyProfileForm
        profile={profile}
        redirectToNewJobAfterSave={setup === "required"}
      />
    </main>
  );
}
