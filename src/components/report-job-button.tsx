"use client";

import { useState } from "react";

const REASONS = [
  { value: "scam", label: "Looks like a scam" },
  { value: "asks_for_money", label: "Asks me to pay or buy something" },
  { value: "personal_info", label: "Asks for bank, card, or Social Security info" },
  { value: "misleading", label: "Job details are false or misleading" },
  { value: "offensive", label: "Offensive or discriminatory" },
  { value: "other", label: "Something else" },
] as const;

export function ReportJobButton({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REASONS[0].value);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/job-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId, reason, details: details.trim() || null }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Could not send your report.");
      }
      setSent(true);
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not send your report.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <p className="text-xs text-[#437a22]">
        Thanks — we&apos;ll review this listing. Don&apos;t send the employer money or
        personal information while we look into it.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-[#964219] underline underline-offset-2"
      >
        Report this listing
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-[#964219]/25 bg-white p-4">
      <p className="text-sm font-semibold">What&apos;s wrong with this listing?</p>
      <div className="space-y-1">
        {REASONS.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="reason"
              value={option.value}
              checked={reason === option.value}
              onChange={() => setReason(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="Anything else we should know? (optional)"
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      {error ? <p className="text-xs text-[#a12c7b]">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={sending}
          className="rounded-xl bg-[#964219] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {sending ? "Sending…" : "Send report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border px-3 py-1.5 text-xs font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
