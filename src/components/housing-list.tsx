"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { HousingOption } from "@/lib/types";

export function HousingList({ options }: { options: HousingOption[] }) {
  const [filterFelony, setFilterFelony] = useState(false);

  const list = filterFelony ? options.filter((h) => h.acceptsFelony) : options;

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterFelony(!filterFelony)}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            filterFelony ? "bg-[#01696f] text-white" : "border border-[#7a7974]/30"
          }`}
        >
          Accepts felony history (if known)
        </button>
        {["Cost", "Distance", "Transit access", "Waitlist open"].map((f) => (
          <button
            key={f}
            type="button"
            className="rounded-full border border-[#7a7974]/30 px-3 py-1 text-xs font-medium"
          >
            {f}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {list.map((h) => (
          <Card key={h.id}>
            <div className="flex justify-between">
              <h3 className="font-semibold">{h.name}</h3>
              <span className="text-xs text-[#7a7974]">{h.type}</span>
            </div>
            <p className="mt-1 text-sm text-[#7a7974]">
              {h.cost} · {h.distance}
              {h.acceptsFelony ? " · Accepts felony history (reported)" : ""}
            </p>
            <p className="mt-1 text-xs text-[#7a7974]">
              Transit: {h.transitAccess ? "Yes" : "Limited"} · Waitlist:{" "}
              {h.waitlistOpen ? "Open" : "Closed"}
            </p>
          </Card>
        ))}
      </div>
    </>
  );
}
