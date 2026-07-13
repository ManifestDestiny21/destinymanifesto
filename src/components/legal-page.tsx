import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LegalFooter } from "@/components/legal-footer";

type LegalPageProps = {
  title: string;
  children: React.ReactNode;
};

export function LegalPage({ title, children }: LegalPageProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-slate-600 transition hover:text-slate-900"
      >
        ← Back to welcome
      </Link>

      <div className="mb-8 flex justify-center">
        <BrandLogo size="sm" />
      </div>

      <article className="flex-1 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">{title}</h1>
        <div className="prose-legal space-y-4 text-sm leading-relaxed text-slate-600">
          {children}
        </div>
      </article>

      <div className="mt-8">
        <LegalFooter />
      </div>
    </main>
  );
}
