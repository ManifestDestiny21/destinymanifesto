import Link from "next/link";
import { redirect } from "next/navigation";
import { JobForm } from "@/components/job-form";
import { requireRole } from "@/lib/auth/guards";
import {
  getCompanyProfile,
  hasCompleteCompanyProfile,
} from "@/lib/employer/company-profile";

export default async function NewJobPage() {
  const { supabase, user } = await requireRole("employer");
  const company = await getCompanyProfile(supabase, user.id);

  if (!hasCompleteCompanyProfile(company)) {
    redirect("/profile?setup=required");
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <div className="mb-4">
        <Link href="/employer/dashboard" className="text-sm text-blue-600">
          Back to dashboard
        </Link>
      </div>
      <JobForm />
    </main>
  );
}
