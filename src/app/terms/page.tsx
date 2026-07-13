import { LegalPage } from "@/components/legal-page";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These Terms of Service govern your use of Destiny Manifesto. By creating
        an account or using our platform, you agree to these terms.
      </p>
      <p>
        Employers are responsible for the accuracy of job postings and company
        information. Users are responsible for the accuracy of profile and
        application materials they submit.
      </p>
      <p>
        We may update these terms from time to time. Continued use of the
        platform after changes constitutes acceptance of the revised terms.
      </p>
      <p className="text-xs text-slate-400">
        This is a placeholder policy. Replace with your finalized legal copy
        before launch.
      </p>
    </LegalPage>
  );
}
