import { PageHeader } from "@/components/page-header";
import { AiToolForm } from "@/components/ai-tool-form";
import { Disclaimer } from "@/components/ui/disclaimer";

export default function ResumePage() {
  return (
    <div>
      <PageHeader
        title="Resume bullet generator"
        subtitle="Turn your real experience into strong, truthful bullets."
      />
      <Disclaimer className="mb-4">
        Only include experience and skills that are accurate. You are responsible for what you
        submit to employers.
      </Disclaimer>
      <AiToolForm
        title="Generate resume bullets"
        description="Describe a role, task, or skill in your own words."
        placeholder="e.g. Sorted packages in a warehouse, met daily quotas, helped train new hires"
        generateLabel="Generate bullets"
        sampleOutput={`AI-generated resume bullets (review before use):

• Sorted and staged outbound shipments in a fast-paced warehouse, meeting daily productivity targets
• Supported onboarding for 2 new team members on safety and packing procedures
• Maintained accurate inventory counts using handheld scanners`}
      />
    </div>
  );
}
