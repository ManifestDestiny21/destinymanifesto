"use client";

import { FELONY_RATING_LABELS } from "@/lib/mock-data";

export function FelonyRating({ rating }: { rating: 0 | 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="group relative inline-flex items-center gap-1">
      <span className="text-xs font-medium text-[#7a7974]">Felony-friendly estimate</span>
      <div className="flex gap-0.5">
        {[0, 1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`h-2 w-2 rounded-full ${n <= rating ? "bg-[#437a22]" : "bg-[#7a7974]/25"}`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-[#437a22]">{rating}/5</span>
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 hidden w-64 rounded-xl border border-[#7a7974]/20 bg-[#fbfbf9] p-3 text-xs leading-relaxed text-[#28251d] shadow-lg group-hover:block"
      >
        <strong>{FELONY_RATING_LABELS[rating]}</strong>
        <p className="mt-1 text-[#7a7974]">
          This is an AI-assisted estimate based on available job details, employer signals,
          tags, and public information. It is not a guarantee. The employer makes the final
          hiring decision.
        </p>
      </div>
    </div>
  );
}
