import Link from "next/link";
import { notFound } from "next/navigation";
import { JobForm } from "@/components/job-form";
import { requireRole } from "@/lib/auth/guards";
import type { DbJob } from "@/lib/types";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireRole("employer");

  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("employer_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!job) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <div className="mb-4">
        <Link href="/employer/dashboard" className="text-sm text-blue-600">
          Back to dashboard
        </Link>
      </div>
      <JobForm job={job as DbJob} />
    </main>
  );
}
