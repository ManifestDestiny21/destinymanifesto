import Link from "next/link";

export function LegalFooter() {
  const linkClass =
    "text-slate-500 underline-offset-4 transition hover:text-slate-700 hover:underline";

  return (
    <footer className="mt-auto w-full border-t border-slate-200/80 pt-6 text-center text-xs text-slate-500">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link href="/terms" className={linkClass}>
          Terms of Service
        </Link>
        <span className="text-slate-300" aria-hidden>
          ·
        </span>
        <Link href="/cookies" className={linkClass}>
          Cookie Policy
        </Link>
        <span className="text-slate-300" aria-hidden>
          ·
        </span>
        <Link href="/privacy" className={linkClass}>
          Privacy Policy
        </Link>
      </nav>
      <p className="mt-3 text-slate-400">
        © {new Date().getFullYear()} Destiny Manifesto. All rights reserved.
      </p>
    </footer>
  );
}
