import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { AiBadge } from "@/components/ui/ai-badge";

const OPTIONS = [
  { title: "Public transit", detail: "COTA monthly passes and reduced fares" },
  { title: "Workforce transportation", detail: "Job search shuttle — career center enrollment" },
  { title: "Rideshare vouchers", detail: "Interview trip vouchers (limited availability)" },
  { title: "Bike programs", detail: "Refurbished bikes for work commute" },
  { title: "License reinstatement", detail: "Fee waivers and payment plans — see Law Library" },
  { title: "Car repair assistance", detail: "Nonprofit partner programs by ZIP" },
  { title: "Gas card programs", detail: "Training or verified employment required" },
];

export default function TransportationPage() {
  return (
    <div>
      <PageHeader
        title="Transportation resources"
        subtitle="Get to work, interviews, and appointments reliably."
      />
      <div className="space-y-3">
        {OPTIONS.map((opt) => (
          <Card key={opt.title}>
            <div className="flex justify-between gap-2">
              <h3 className="font-semibold">{opt.title}</h3>
              <AiBadge />
            </div>
            <p className="mt-1 text-sm text-[#7a7974]">{opt.detail}</p>
            <p className="mt-2 text-xs italic text-[#7a7974]">
              AI-generated summary — verify eligibility with the provider.
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
