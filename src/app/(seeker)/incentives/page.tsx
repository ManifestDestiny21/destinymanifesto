import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { AiBadge } from "@/components/ui/ai-badge";

const INCENTIVES = [
  "Employment incentives & training grants",
  "Federal Work Opportunity Tax Credit (employers)",
  "Reentry nonprofit programs",
  "Education support & GED scholarships",
  "Housing deposit assistance",
  "Transportation vouchers",
  "Free legal clinic nights",
  "Sponsored coaching opportunities",
];

export default function IncentivesPage() {
  return (
    <div>
      <PageHeader
        title="Local incentives"
        subtitle="Programs that may reduce costs or support your next chapter."
      />
      <div className="space-y-3">
        {INCENTIVES.map((item) => (
          <Card key={item} className="border-[#b8860b]/20">
            <div className="flex justify-between gap-2">
              <h3 className="font-semibold text-[#964219]">{item}</h3>
              <AiBadge />
            </div>
            <p className="mt-1 text-sm text-[#7a7974]">
              AI-generated: Programs vary by ZIP and eligibility. This is not a guarantee of
              approval.
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
