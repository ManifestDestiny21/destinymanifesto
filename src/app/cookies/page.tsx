import { LegalPage } from "@/components/legal-page";

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy">
      <p>
        Destiny Manifesto uses cookies and similar technologies to keep you
        signed in, remember preferences, and understand how the platform is used.
      </p>
      <p>
        Essential cookies are required for authentication and security. Analytics
        cookies help us improve the experience and are only used in accordance
        with this policy.
      </p>
      <p>
        You can control non-essential cookies through your browser settings.
        Disabling essential cookies may limit your ability to use signed-in
        features.
      </p>
      <p className="text-xs text-slate-400">
        This is a placeholder policy. Replace with your finalized legal copy
        before launch.
      </p>
    </LegalPage>
  );
}
