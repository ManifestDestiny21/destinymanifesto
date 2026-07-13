"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Disclaimer } from "@/components/ui/disclaimer";
import type { LawArticle } from "@/lib/types";

export function LawLibraryClient({
  articles,
  categories,
}: {
  articles: LawArticle[];
  categories: string[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const filtered = articles.filter((a) => {
    const matchQuery =
      !query ||
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.summary.toLowerCase().includes(query.toLowerCase());
    const matchCat = !category || a.category === category;
    return matchQuery && matchCat;
  });

  return (
    <>
      <Disclaimer variant="legal" className="mb-4">
        This information is educational and is not legal advice. For legal advice, contact a
        qualified attorney or legal aid organization.
      </Disclaimer>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search topics..."
        className="mb-4 w-full rounded-xl border border-[#7a7974]/25 bg-[#fbfbf9] px-3 py-2 text-sm"
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={`rounded-full px-3 py-1 text-xs ${!category ? "bg-[#01696f] text-white" : "border"}`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-xs ${
              category === c ? "bg-[#01696f] text-white" : "border"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((a) => (
          <Card key={a.id}>
            <p className="text-xs text-[#7a7974]">{a.category}</p>
            <h3 className="font-semibold">{a.title}</h3>
            <p className="mt-1 text-sm text-[#7a7974]">{a.summary}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
