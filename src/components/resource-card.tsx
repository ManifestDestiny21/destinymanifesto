import { AiBadge } from "@/components/ui/ai-badge";
import { Card } from "@/components/ui/card";
import type { Resource } from "@/lib/types";

export function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#7a7974]">
            {resource.category}
          </p>
          <h3 className="mt-0.5 font-semibold text-[#28251d]">{resource.name}</h3>
        </div>
        <AiBadge />
      </div>
      <p className="mt-2 text-sm text-[#7a7974]">
        {resource.location} · {resource.distance}
      </p>
      <p className="mt-2 text-sm leading-relaxed">{resource.aiSummary}</p>
      <p className="mt-2 text-xs text-[#7a7974]">Eligibility: {resource.eligibility}</p>
      <p className="text-xs text-[#7a7974]">Contact: {resource.contact}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={resource.link}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-[#01696f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0c4e54]"
        >
          Open link
        </a>
        <button
          type="button"
          className="rounded-xl border border-[#7a7974]/30 px-3 py-1.5 text-xs font-semibold"
        >
          Save
        </button>
        <button
          type="button"
          className="rounded-xl border border-[#b8860b]/40 bg-[#b8860b]/10 px-3 py-1.5 text-xs font-semibold text-[#964219]"
        >
          Add reminder
        </button>
      </div>
    </Card>
  );
}
