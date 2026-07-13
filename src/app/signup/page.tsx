import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { UserAccountForm } from "@/components/user-account-form";
import { BrandLogo } from "@/components/brand-logo";
import { LegalFooter } from "@/components/legal-footer";
import { createClient } from "@/lib/supabase/server";
import { getHomePath, resolveUserRole } from "@/lib/auth/roles";

type Props = {
  searchParams: Promise<{ role?: string }>;
};

export default async function SignupPage({ searchParams }: Props) {
  const { role } = await searchParams;
  const isJobSeeker = role === "job-seeker";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const userRole = await resolveUserRole(supabase, user);
    if (userRole) {
      redirect(getHomePath(userRole));
    }
  }

  return (
    <main
      className={`mx-auto flex min-h-screen flex-col px-6 py-10 ${
        isJobSeeker ? "max-w-4xl" : "w-full max-w-lg"
      }`}
    >
      <div className="mb-8 text-center">
        <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
          ← Back to welcome
        </Link>
        {!isJobSeeker ? (
          <div className="mt-6 flex justify-center">
            <BrandLogo />
          </div>
        ) : null}
        <p className="mt-3 text-sm text-slate-600">
          {isJobSeeker ? "Create your job seeker account" : "Create your employer account"}
        </p>
      </div>

      {isJobSeeker ? (
        <UserAccountForm />
      ) : (
        <AuthForm mode="signup" />
      )}

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href={isJobSeeker ? "/login?role=job-seeker" : "/login"}
          className="text-[#1570ef] hover:underline"
        >
          Sign in
        </Link>
      </p>

      <div className="mt-10">
        <LegalFooter />
      </div>
    </main>
  );
}
