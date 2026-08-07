"use client";

import { useState } from "react";

import { AskSanchayChat } from "~/components/ask-sanchay-chat";

type Section = "ask-sanchay";

const SECTIONS: { id: Section; label: string; description: string }[] = [
  { id: "ask-sanchay", label: "Ask Sanchay", description: "Ask about your own spending, in plain language" },
];

export default function SettingsPage() {
  const [selected, setSelected] = useState<Section>("ask-sanchay");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-navy">Settings</h1>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <div className="flex gap-2 overflow-x-auto md:w-64 md:shrink-0 md:flex-col md:gap-1 md:overflow-visible">
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

        <div className="min-h-[420px] flex-1 rounded-2xl border border-border bg-card px-5 py-5">
          {selected === "ask-sanchay" && <AskSanchayChat />}
        </div>
      </div>
    </div>
  );
}
