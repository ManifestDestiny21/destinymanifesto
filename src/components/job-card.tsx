import Link from "next/link";
import { FelonyRating } from "@/components/felony-rating";
import { JobActions } from "@/components/job-actions";
import { AiBadge } from "@/components/ui/ai-badge";
import { Card } from "@/components/ui/card";
import type { ApplicationStatus, Job } from "@/lib/types";

type Props = {
  job: Job;
  applicationStatus?: ApplicationStatus | null;
  liveJob?: boolean;
};

export function JobCard({ job, applicationStatus = null, liveJob = true }: Props) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href={`/jobs/${job.id}`} className="text-lg font-semibold text-[#28251d] hover:text-[#01696f]">
            {job.title}
          </Link>
          <p className="text-sm text-[#7a7974]">{job.employer}</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#437a22]/15 px-2.5 py-1 text-xs font-bold text-[#437a22]">
          {job.matchScore}% match
        </span>
      </div>
      <p className="text-sm text-[#7a7974]">
        {job.location} · {job.distance} · {job.payRange} · {job.employmentType}
      </p>
      <p className="text-sm leading-relaxed text-[#28251d]">{job.aiSummary}</p>
      <div className="flex flex-wrap gap-1.5">
        {job.tags.slice(0, 5).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[#f7f6f2] px-2 py-0.5 text-[11px] font-medium text-[#7a7974]"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#7a7974]/10 pt-3">
        <FelonyRating rating={job.felonyFriendlyRating} />
        <AiBadge />
      </div>
      <JobActions
        jobId={job.id}
        jobTitle={job.title}
        initialStatus={applicationStatus}
        liveJob={liveJob}
        layout="card"
      />
    </Card>
  );
}
