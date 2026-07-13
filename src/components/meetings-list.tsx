"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import type { Meeting } from "@/lib/types";

export function MeetingsList({ meetings }: { meetings: Meeting[] }) {
  const [onlineOnly, setOnlineOnly] = useState(false);
  const list = onlineOnly ? meetings.filter((m) => m.online) : meetings;

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOnlineOnly(!onlineOnly)}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            onlineOnly ? "bg-[#01696f] text-white" : "border"
          }`}
        >
          Online only
        </button>
        {["Date", "Distance", "Recovery", "Legal clinic"].map((f) => (
          <button key={f} type="button" className="rounded-full border px-3 py-1 text-xs">
            {f}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {list.map((m) => (
          <Card key={m.id}>
            <p className="text-xs font-medium uppercase text-[#7a7974]">{m.type}</p>
            <h3 className="font-semibold">{m.title}</h3>
            <p className="mt-1 text-sm text-[#7a7974]">
              {m.date} · {m.location}
              {!m.online && ` · ${m.distance}`}
            </p>
            {m.online ? (
              <span className="mt-2 inline-block rounded-full bg-[#01696f]/10 px-2 py-0.5 text-xs text-[#01696f]">
                Online
              </span>
            ) : null}
          </Card>
        ))}
      </div>
    </>
  );
}
