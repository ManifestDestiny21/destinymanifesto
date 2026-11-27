import Link from "next/link";
import { EmployerJobActions } from "@/components/employer-job-actions";
import { DbJob } from "@/lib/types";

type Props = {
  jobs: DbJob[];
  canPostJobs?: boolean;
};

export function JobsTable({ jobs, canPostJobs = true }: Props) {
  if (!jobs.length) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="mb-3 text-slate-600">No jobs posted yet.</p>
        {canPostJobs ? (
          <Link href="/jobs/new" className="text-sm font-medium text-blue-600">
            Create your first job
          </Link>
        ) : (
          <Link href="/profile" className="text-sm font-medium text-blue-600">
            Complete your company profile to post jobs
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-4 py-3 font-semibold">Title</th>
            <th className="px-4 py-3 font-semibold">Location</th>
            <th className="px-4 py-3 font-semibold">Salary</th>
            <th className="px-4 py-3 font-semibold">Felon-Friendly</th>
            <th className="px-4 py-3 font-semibold">Posted</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-b border-slate-100">
              <td className="px-4 py-3 font-medium">
                {job.title}
                {job.hidden ? (
                  <span
                    className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-800"
                    title={job.hidden_reason ?? undefined}
                  >
                    Hidden
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3">{job.location}</td>
              <td className="px-4 py-3">{job.salary_range ?? "—"}</td>
              <td className="px-4 py-3">{job.felon_friendly ? "Yes" : "No"}</td>
              <td className="px-4 py-3">
                {new Date(job.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <EmployerJobActions job={job} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
