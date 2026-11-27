import Link from "next/link";

export const metadata = {
  title: "Temporarily unavailable · Destiny Manifesto",
};

export default function ServiceUnavailablePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 text-center">
      <h1 className="text-2xl font-bold text-[#28251d]">We&apos;ll be right back</h1>
      <p className="mt-3 text-sm text-[#7a7974]">
        Sign-in is temporarily unavailable. Nothing you&apos;ve saved has been lost. Please wait a
        minute and refresh this page.
      </p>
      <Link href="/" className="mt-6 text-sm font-medium text-[#01696f]">
        Go to the home page
      </Link>
    </main>
  );
}
