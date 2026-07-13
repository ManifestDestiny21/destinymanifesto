"use client";

import { useState } from "react";
import { JobCard } from "@/components/job-card";
import { Card } from "@/components/ui/card";
import type { ApplicationStatus, Job } from "@/lib/types";

const FILTERS = [
  "Felony-friendly",
  "Entry level",
  "Weekly pay",
  "No CDL",
  "Match score",
];

export function JobsBoard({
  jobs,
  dataSource,
  applicationStatuses = {},
  seekerLocationLabel,
}: {
  jobs: Job[];
  dataSource: "supabase" | "mock";
  applicationStatuses?: Record<string, ApplicationStatus>;
  seekerLocationLabel?: string;
}) {
  const [keyword, setKeyword] = useState("");

  const filtered = jobs.filter(
    (j) =>
      !keyword ||
      j.title.toLowerCase().includes(keyword.toLowerCase()) ||
      j.employer.toLowerCase().includes(keyword.toLowerCase()) ||
      j.location.toLowerCase().includes(keyword.toLowerCase()) ||
      j.description.toLowerCase().includes(keyword.toLowerCase()),
  );

  return (
    <div>
      {seekerLocationLabel ? (
        <p className="mb-2 text-sm text-[#7a7974]">
          Showing options for <span className="font-medium text-[#28251d]">{seekerLocationLabel}</span>
        </p>
      ) : null}
      {dataSource === "supabase" ? (
        <p className="mb-4 rounded-xl border border-[#437a22]/25 bg-[#437a22]/8 px-3 py-2 text-xs text-[#437a22]">
          Showing live jobs from employers on Destiny Manifesto with AI-generated summaries.
        </p>
      ) : (
        <p className="mb-4 rounded-xl border border-[#964219]/25 bg-[#964219]/8 px-3 py-2 text-xs text-[#964219]">
          Local demo jobs for your area. Update your city and state in onboarding or settings to
          match where you want work.
        </p>
      )}
      <Card className="mb-6">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search jobs, employers, cities, skills..."
          className="mb-3 w-full rounded-xl border border-[#7a7974]/25 bg-[#f7f6f2] px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className="rounded-full border border-[#7a7974]/25 px-3 py-1 text-xs font-medium hover:border-[#01696f]"
            >
              {f}
            </button>
          ))}
        </div>
      </Card>
      {filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-[#7a7974]">
            No jobs match your search yet. Employers can post jobs in the employer portal — they
            will appear here with AI summaries automatically.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              applicationStatus={applicationStatuses[job.id] ?? null}
              liveJob={dataSource === "supabase"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
