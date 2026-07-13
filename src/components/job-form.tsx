"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { DbJob } from "@/lib/types";

type Props = {
  job?: DbJob;
};

export function JobForm({ job }: Props) {
  const router = useRouter();
  const isEdit = Boolean(job);

  const [title, setTitle] = useState(job?.title ?? "");
  const [location, setLocation] = useState(job?.location ?? "");
  const [salaryRange, setSalaryRange] = useState(job?.salary_range ?? "");
  const [description, setDescription] = useState(job?.description ?? "");
  const [felonFriendly, setFelonFriendly] = useState(job?.felon_friendly ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      title,
      location,
      salaryRange,
      description,
      felonFriendly,
    };

    const res = await fetch(isEdit ? `/api/jobs/${job!.id}` : "/api/jobs", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responsePayload = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(responsePayload.error ?? `Failed to ${isEdit ? "update" : "create"} job`);
      return;
    }

    if (responsePayload.warning) {
      setMessage(responsePayload.warning);
    }

    router.push("/employer/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">{isEdit ? "Edit job listing" : "Post a job"}</h2>

      <div>
        <label className="mb-1 block text-sm font-medium">Job Title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Location</label>
        <input
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Salary Range</label>
        <input
          value={salaryRange}
          onChange={(e) => setSalaryRange(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="$60,000 - $80,000"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          rows={5}
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={felonFriendly}
          onChange={(e) => setFelonFriendly(e.target.checked)}
        />
        Mark this role as felon-friendly
      </label>

      <p className="text-xs text-slate-500">
        {isEdit
          ? "Saving updates the listing and refreshes the AI summary, tags, and felony-friendly estimate."
          : "After you publish, an AI-generated summary, tags, and felony-friendly estimate (0–5) are saved automatically for job seekers. This is an estimate, not a guarantee."}
      </p>

      {message ? <p className="text-sm text-amber-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => router.push("/employer/dashboard")}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : isEdit ? "Save changes" : "Publish job"}
        </button>
      </div>
    </form>
  );
}
