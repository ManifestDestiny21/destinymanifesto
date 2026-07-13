"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { AiBadge } from "@/components/ui/ai-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const QUESTIONS = [
  "Tell me about yourself and why you want this role.",
  "Describe a time you showed up reliably under pressure.",
  "How do you handle feedback from a supervisor?",
  "What steps are you taking to build stability after reentry?",
];

export default function InterviewPage() {
  const [index, setIndex] = useState(0);

  return (
    <div>
      <PageHeader
        title="Interview practice"
        subtitle="Practice questions with AI-generated prompts — answer out loud or in writing."
      />
      <Card>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#7a7974]">
            Question {index + 1} of {QUESTIONS.length}
          </span>
          <AiBadge />
        </div>
        <p className="mt-4 text-lg font-medium leading-relaxed">{QUESTIONS[index]}</p>
        <textarea
          rows={5}
          placeholder="Practice your answer here..."
          className="mt-4 w-full rounded-xl border border-[#7a7974]/25 bg-[#f7f6f2] px-3 py-2 text-sm"
        />
        <div className="mt-4 flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            Previous
          </Button>
          <Button
            onClick={() => setIndex((i) => Math.min(QUESTIONS.length - 1, i + 1))}
          >
            Next question
          </Button>
        </div>
      </Card>
    </div>
  );
}
