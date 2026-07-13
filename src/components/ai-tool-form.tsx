"use client";

import { useState } from "react";
import { AiBadge } from "@/components/ui/ai-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/disclaimer";

type AiToolFormProps = {
  title: string;
  description: string;
  placeholder: string;
  generateLabel: string;
  sampleOutput: string;
};

export function AiToolForm({
  title,
  description,
  placeholder,
  generateLabel,
  sampleOutput,
}: AiToolFormProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="font-semibold text-[#28251d]">{title}</h2>
        <p className="mt-1 text-sm text-[#7a7974]">{description}</p>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="mt-4 w-full rounded-xl border border-[#7a7974]/25 bg-[#f7f6f2] px-3 py-2 text-sm outline-none focus:border-[#01696f]"
        />
        <Button
          className="mt-3"
          onClick={() => setOutput(sampleOutput.replace("{input}", input || "your experience"))}
        >
          {generateLabel}
        </Button>
      </Card>
      {output ? (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">Result</span>
            <AiBadge />
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{output}</p>
          <Disclaimer className="mt-3">
            This is an AI-assisted estimate, not a guarantee. Review and edit before using.
            You are responsible for final decisions.
          </Disclaimer>
        </Card>
      ) : null}
    </div>
  );
}
