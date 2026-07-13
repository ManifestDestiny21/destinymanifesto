"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { AiBadge } from "@/components/ui/ai-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ComposeMessagePage() {
  const [review, setReview] = useState(false);

  if (review) {
    return (
      <div>
        <PageHeader title="Review before sending" subtitle="Confirm everything looks right." />
        <Card>
          <p className="text-xs text-[#7a7974]">Recipient</p>
          <p className="font-medium">Second Chance Logistics — Hiring</p>
          <p className="mt-3 text-xs text-[#7a7974]">Subject</p>
          <p className="font-medium">Following up on Warehouse Associate application</p>
          <p className="mt-3 text-xs text-[#7a7974]">Message</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
            {`AI-generated draft:\n\nHello,\n\nI applied for the Warehouse Associate position and wanted to express my continued interest. I am reliable, motivated, and committed to law-abiding work. Thank you for your consideration.`}
          </p>
          <p className="mt-2 text-xs text-[#7a7974]">Attachments: None</p>
          <AiBadge className="mt-3" />
          <div className="mt-4 flex gap-2">
            <Button onClick={() => alert("Message sent (demo)")}>Send</Button>
            <Button variant="secondary" onClick={() => setReview(false)}>
              Edit
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Link href="/messages" className="text-sm font-medium text-[#01696f]">
        ← Inbox
      </Link>
      <div className="mt-4">
        <PageHeader title="Compose message" />
      </div>
      <Card className="mt-4 space-y-4">
        <label className="block text-sm font-medium">
          Recipient
          <input className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" placeholder="Employer or coach" />
        </label>
        <label className="block text-sm font-medium">
          Subject
          <input className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
        </label>
        <label className="block text-sm font-medium">
          Message
          <textarea rows={6} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" />
        </label>
        <Button onClick={() => setReview(true)}>Review & send</Button>
      </Card>
    </div>
  );
}
