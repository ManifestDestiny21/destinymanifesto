import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { recentMessagesForSeeker } from "@/lib/local-content";
import { requireRole } from "@/lib/auth/guards";

export default async function MessagesPage() {
  await requireRole("job_seeker");
  const messages = recentMessagesForSeeker();

  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle="Employer outreach, coach messages, support, and AI drafts."
      />
      <Link
        href="/messages/compose"
        className="mb-4 inline-block rounded-xl bg-[#01696f] px-4 py-2 text-sm font-semibold text-white"
      >
        New message
      </Link>
      <div className="space-y-3">
        {messages.map((m) => (
          <Link key={m.id} href="/messages/compose">
            <Card className={m.unread ? "border-[#01696f]/30" : ""}>
              <div className="flex justify-between gap-2">
                <span className="text-xs font-medium uppercase text-[#7a7974]">{m.type}</span>
                {m.unread ? (
                  <span className="h-2 w-2 rounded-full bg-[#01696f]" aria-label="Unread" />
                ) : null}
              </div>
              <p className="font-semibold">{m.from}</p>
              <p className="text-sm font-medium">{m.subject}</p>
              <p className="mt-1 line-clamp-2 text-sm text-[#7a7974]">{m.preview}</p>
              <p className="mt-1 text-xs text-[#7a7974]">{m.date}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
