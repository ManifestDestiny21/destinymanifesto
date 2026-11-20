/** Start of today in local time (midnight). */
export function startOfToday(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** True when the event end (or start) is still today or later. */
export function isUpcoming(isoDate: string | null | undefined, now = new Date()): boolean {
  if (!isoDate) return false;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() >= startOfToday(now).getTime();
}

/** Calendar date at local midnight, offset by N days from today. */
export function daysFromToday(offsetDays: number, now = new Date()): Date {
  const d = startOfToday(now);
  d.setDate(d.getDate() + offsetDays);
  return d;
}

/** Format like "July 25, 2026 · 10 AM – 2 PM" */
export function formatFairWindow(
  day: Date,
  startHour: number,
  endHour: number
): string {
  const datePart = day.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `${datePart} · ${formatHour(startHour)} – ${formatHour(endHour)}`;
}

/** Format like "July 25, 10:00 AM" */
export function formatMeetingWhen(day: Date, hour: number, minute = 0): string {
  const datePart = day.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const time = new Date(day);
  time.setHours(hour, minute, 0, 0);
  const timePart = time.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart}, ${timePart}`;
}

/** Short teaser like "Jul 25" */
export function formatShortDate(day: Date): string {
  return day.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatHour(hour: number): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric" });
}

/**
 * Build an ISO timestamp for a local calendar day + hour.
 * Used so past events can be filtered automatically without a cron job.
 */
export function toLocalIso(day: Date, hour: number, minute = 0): string {
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0);
  return d.toISOString();
}
