import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { BrandLogo } from "@/components/brand-logo";
import { LegalFooter } from "@/components/legal-footer";
import { createClient } from "@/lib/supabase/server";
import { getHomePath, getUserRole } from "@/lib/auth/roles";

type Props = {
  searchParams: Promise<{ role?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { role } = await searchParams;
  const isJobSeeker = role === "job-seeker";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const userRole = getUserRole(user);
    if (userRole) {
      redirect(getHomePath(userRole));
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-6 py-10">
      <div className="mb-8 text-center">
        <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to welcome
        </Link>
        <div className="mt-6 flex justify-center">
          <BrandLogo />
        </div>
        <p className="mt-3 text-sm text-slate-600">
          {isJobSeeker ? "Job seeker sign in" : "Employer sign in"}
        </p>
      </div>

      <AuthForm mode="login" role={isJobSeeker ? "job-seeker" : "employer"} />

      <p className="mt-4 text-center text-sm text-slate-600">
        Need an account?{" "}
        <Link
          href={isJobSeeker ? "/signup?role=job-seeker" : "/signup"}
          className="text-[#1570ef] hover:underline"
        >
          Create an account
        </Link>
      </p>

      <div className="mt-10">
        <LegalFooter />
      </div>
    </main>
  );
}
