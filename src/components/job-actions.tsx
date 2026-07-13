"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApplicationStatus } from "@/lib/types";
import { isPersistableJobId } from "@/lib/job-applications";

type Props = {
  jobId: string;
  jobTitle: string;
  initialStatus?: ApplicationStatus | null;
  layout?: "card" | "detail";
  liveJob?: boolean;
};

export function JobActions({
  jobId,
  jobTitle,
  initialStatus = null,
  layout = "card",
  liveJob = true,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<ApplicationStatus | null>(initialStatus);
  const [loading, setLoading] = useState<"save" | "apply" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const canPersist = liveJob && isPersistableJobId(jobId);
  const isSaved = status === "saved";
  const isApplied = status === "applied" || status === "interview" || status === "offer";

  async function handleSave() {
    if (!canPersist) return;
    setLoading("save");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/job-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, action: "save" }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save job");
      }
      setStatus(payload.status);
      setMessage("Job saved.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save job");
    } finally {
      setLoading(null);
    }
  }

  async function handleApply() {
    if (!canPersist) return;
    setLoading("apply");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/job-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, action: "apply", note: note || null }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not apply");
      }
      setStatus(payload.status);
      setShowApplyForm(false);
      setMessage(`Application submitted for ${jobTitle}.`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not apply");
    } finally {
      setLoading(null);
    }
  }

  async function handleRemove() {
    if (!canPersist || !isSaved) return;
    setLoading("remove");
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/job-applications?job_id=${jobId}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not remove saved job");
      }
      setStatus(null);
      setMessage("Removed from saved jobs.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not remove saved job");
    } finally {
      setLoading(null);
    }
  }

  if (!canPersist) {
    return (
      <p className="text-xs text-[#964219]">
        Demo listing — save and apply work on live employer jobs.
      </p>
    );
  }

  if (layout === "card") {
    return (
      <div>
        <div className="flex gap-2">
          {isApplied ? (
            <span className="flex-1 rounded-xl border border-[#01696f]/30 bg-[#01696f]/10 py-2 text-center text-sm font-semibold text-[#01696f]">
              Applied
            </span>
          ) : isSaved ? (
            <button
              type="button"
              disabled={loading !== null}
              onClick={handleRemove}
              className="flex-1 rounded-xl border border-[#437a22]/40 bg-[#437a22]/10 py-2 text-sm font-semibold text-[#437a22] disabled:opacity-50"
            >
              {loading === "remove" ? "Removing..." : "Saved"}
            </button>
          ) : (
            <button
              type="button"
              disabled={loading !== null}
              onClick={handleSave}
              className="flex-1 rounded-xl border border-[#7a7974]/30 py-2 text-sm font-semibold text-[#28251d] hover:border-[#01696f] disabled:opacity-50"
            >
              {loading === "save" ? "Saving..." : "Save"}
            </button>
          )}
          {isApplied ? (
            <Link
              href="/saved-jobs"
              className="flex-1 rounded-xl bg-[#01696f] py-2 text-center text-sm font-semibold text-white hover:bg-[#0c4e54]"
            >
              Track
            </Link>
          ) : (
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => setShowApplyForm(true)}
              className="flex-1 rounded-xl bg-[#01696f] py-2 text-sm font-semibold text-white hover:bg-[#0c4e54] disabled:opacity-50"
            >
              Apply
            </button>
          )}
        </div>
        {showApplyForm ? (
          <div className="mt-3 space-y-2 rounded-xl border border-[#7a7974]/20 bg-[#fbfbf9] p-3">
            <label className="block text-xs font-medium text-[#7a7974]">
              Optional note to employer
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Brief introduction or question..."
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowApplyForm(false)}
                className="flex-1 rounded-lg border px-3 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading === "apply"}
                onClick={handleApply}
                className="flex-1 rounded-lg bg-[#01696f] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading === "apply" ? "Submitting..." : "Submit application"}
              </button>
            </div>
          </div>
        ) : null}
        {message ? <p className="mt-2 text-xs text-[#437a22]">{message}</p> : null}
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2">
        {isApplied ? (
          <span className="inline-flex items-center justify-center rounded-xl border border-[#01696f]/30 bg-[#01696f]/10 px-4 py-2.5 text-sm font-semibold text-[#01696f]">
            Applied
          </span>
        ) : isSaved ? (
          <button
            type="button"
            disabled={loading !== null}
            onClick={handleRemove}
            className="inline-flex items-center justify-center rounded-xl border border-[#437a22]/40 bg-[#437a22]/10 px-4 py-2.5 text-sm font-semibold text-[#437a22] disabled:opacity-50"
          >
            {loading === "remove" ? "Removing..." : "Saved — remove"}
          </button>
        ) : (
          <button
            type="button"
            disabled={loading !== null}
            onClick={handleSave}
            className="inline-flex items-center justify-center rounded-xl border border-[#7a7974]/40 bg-[#fbfbf9] px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {loading === "save" ? "Saving..." : "Save job"}
          </button>
        )}
        {!isApplied ? (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => setShowApplyForm((value) => !value)}
            className="inline-flex items-center justify-center rounded-xl bg-[#01696f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0c4e54] disabled:opacity-50"
          >
            Apply
          </button>
        ) : (
          <Link
            href="/saved-jobs"
            className="inline-flex items-center justify-center rounded-xl bg-[#01696f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0c4e54]"
          >
            View in tracker
          </Link>
        )}
      </div>
      {showApplyForm && !isApplied ? (
        <div className="mt-4 space-y-3 rounded-xl border border-[#7a7974]/20 bg-[#fbfbf9] p-4">
          <label className="block text-sm font-medium">
            Optional note to employer
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Share a brief introduction, availability, or question..."
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={loading === "apply"}
            onClick={handleApply}
            className="w-full rounded-xl bg-[#01696f] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading === "apply" ? "Submitting application..." : "Submit application"}
          </button>
        </div>
      ) : null}
      {message ? <p className="mt-3 text-sm text-[#437a22]">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
