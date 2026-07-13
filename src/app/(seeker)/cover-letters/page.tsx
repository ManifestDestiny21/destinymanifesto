import { PageHeader } from "@/components/page-header";
import { AiToolForm } from "@/components/ai-tool-form";

export default function CoverLettersPage() {
  return (
    <div>
      <PageHeader
        title="Cover letter generator"
        subtitle="Draft a respectful letter you can edit before sending."
      />
      <AiToolForm
        title="Generate cover letter"
        description="Add the job title and why you're interested (truthful details only)."
        placeholder="Job title and 2–3 sentences about your fit..."
        generateLabel="Generate cover letter"
        sampleOutput={`AI-generated cover letter draft:

Dear Hiring Manager,

I am applying for the role discussed in {input}. I bring reliable attendance, hands-on experience, and a commitment to law-abiding, steady work. I would welcome the chance to discuss how my skills match your team's needs.

Thank you for your consideration,
[Your name]`}
      />
    </div>
  );
}
