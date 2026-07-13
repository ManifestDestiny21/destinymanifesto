import { LegalPage } from "@/components/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        Destiny Manifesto respects your privacy. This policy describes what
        information we collect, how we use it, and the choices you have.
      </p>
      <p>
        We collect account information such as email address, profile details,
        and usage data necessary to operate the job board and employer portal.
      </p>
      <p>
        We do not sell your personal information. Data is stored securely and
        used only to provide and improve our services, comply with law, and
        protect our users.
      </p>
      <p>
        You may request access, correction, or deletion of your data by
        contacting our support team.
      </p>
      <p className="text-xs text-slate-400">
        This is a placeholder policy. Replace with your finalized legal copy
        before launch.
      </p>
    </LegalPage>
  );
}
