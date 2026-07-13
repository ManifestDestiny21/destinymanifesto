import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

export default function BookPage() {
  return (
    <div>
      <PageHeader
        title="Book"
        subtitle="Coming soon — stories and guidance for your next chapter."
      />
      <Card className="text-center">
        <div className="mx-auto flex h-24 w-20 items-center justify-center rounded-lg bg-[#01696f]/10 text-4xl">
          📖
        </div>
        <h2 className="mt-4 text-lg font-semibold">Destiny Manifesto Book</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#7a7974]">
          A future resource with practical reentry guidance, employer perspectives, and
          community voices. This section will unlock when the book launches.
        </p>
        <button
          type="button"
          disabled
          className="mt-6 rounded-xl bg-[#7a7974]/20 px-4 py-2 text-sm font-semibold text-[#7a7974]"
        >
          Notify me when available
        </button>
      </Card>
    </div>
  );
}
