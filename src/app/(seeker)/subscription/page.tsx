import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DEMO_USER } from "@/lib/mock-data";

export default function SubscriptionPage() {
  return (
    <div>
      <PageHeader
        title="Subscription"
        subtitle="Launch offer and plans after your free period."
      />
      <div className="mb-6 rounded-2xl border border-[#b8860b]/40 bg-[#b8860b]/15 px-4 py-3 text-center">
        <p className="text-sm font-bold text-[#964219]">
          Launch offer: Free access for the first 3 months.
        </p>
        <p className="mt-1 text-xs text-[#7a7974]">
          {DEMO_USER.trialDaysLeft} days remaining in your launch period
        </p>
      </div>
      <Card>
        <h2 className="font-semibold">After your free period</h2>
        <p className="mt-2 text-sm text-[#7a7974]">
          Continue with full access to jobs, AI tools, resources, and coaching features.
        </p>
        <p className="mt-4 text-3xl font-bold text-[#28251d]">
          $9.99<span className="text-base font-normal text-[#7a7974]">/month</span>
        </p>
        <ul className="mt-4 space-y-2 text-sm text-[#7a7974]">
          <li>• Unlimited job matches & saved applications</li>
          <li>• AI resume, cover letter, and interview tools</li>
          <li>• Resource reminders & personalized plans</li>
          <li>• Messaging & employer outreach drafts</li>
        </ul>
        <Button className="mt-6 w-full sm:w-auto">Subscribe when trial ends</Button>
        <p className="mt-3 text-xs text-[#7a7974]">
          You will not be charged until your free period ends. Cancel anytime in Settings.
        </p>
      </Card>
    </div>
  );
}
