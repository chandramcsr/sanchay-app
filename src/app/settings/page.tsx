"use client";

import { useState } from "react";

import { AskSanchayChat } from "~/components/ask-sanchay-chat";
import { DiscussionHistorySection } from "~/components/discussion-history-section";

type Section = "ask-sanchay" | "discussion-recorder";

const SECTIONS: { id: Section; label: string; description: string }[] = [
  { id: "ask-sanchay", label: "Ask Sanchay", description: "Ask about your own spending, in plain language" },
  { id: "discussion-recorder", label: "Discussion Recorder", description: "Record and analyze a conversation" },
];

export default function SettingsPage() {
  const [selected, setSelected] = useState<Section>("ask-sanchay");

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border md:min-h-[calc(100vh-9rem)] md:flex-row">
      <div className="flex gap-1 overflow-x-auto bg-cream p-3 md:w-64 md:shrink-0 md:flex-col md:overflow-visible md:border-r md:border-border">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelected(s.id)}
            className={`shrink-0 rounded-xl px-4 py-3 text-left text-sm font-medium transition md:shrink ${
              selected === s.id ? "bg-card text-navy" : "text-muted hover:bg-card/60"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-card p-5">
        {selected === "ask-sanchay" && <AskSanchayChat />}
        {selected === "discussion-recorder" && <DiscussionHistorySection />}
      </div>
    </div>
  );
}
