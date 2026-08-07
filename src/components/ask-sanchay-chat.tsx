"use client";

import { useState } from "react";

import { useAskSanchay } from "~/lib/queries";
import type { AskResponse } from "~/lib/types";

interface Exchange {
  question: string;
  response?: AskResponse;
  error?: string;
}

/**
 * The chat UI itself, extracted so it can render inside a panel (the
 * Settings two-pane layout) rather than only as a standalone page --
 * same component, two different places to embed it, no duplicated
 * chat logic between them.
 */
export function AskSanchayChat() {
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const ask = useAskSanchay();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || ask.isPending) return;
    setQuestion("");
    setExchanges((prev) => [...prev, { question: q }]);

    ask.mutate(q, {
      onSuccess: (response) => {
        setExchanges((prev) => prev.map((ex, i) => (i === prev.length - 1 ? { ...ex, response } : ex)));
      },
      onError: () => {
        setExchanges((prev) =>
          prev.map((ex, i) => (i === prev.length - 1 ? { ...ex, error: "Couldn't get an answer. Try again." } : ex)),
        );
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Ask about your own transactions — answers are grounded in what&apos;s actually in your Activity, with
        the transactions it used shown below each answer.
      </p>

      {exchanges.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-navy">Nothing asked yet.</p>
          <p className="mt-1 text-sm text-muted">Try &quot;how much did I spend on groceries&quot; or similar.</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {exchanges.map((ex, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="self-end rounded-2xl rounded-br-sm bg-navy px-4 py-2.5 text-sm text-white">
              {ex.question}
            </div>

            {ex.error && (
              <div className="self-start rounded-2xl rounded-bl-sm border border-negative/30 bg-negative/5 px-4 py-2.5 text-sm text-negative">
                {ex.error}
              </div>
            )}

            {ex.response && (
              <div className="flex max-w-[85%] flex-col gap-2 self-start">
                <div
                  className={`rounded-2xl rounded-bl-sm border px-4 py-2.5 text-sm ${
                    ex.response.abstained
                      ? "border-dashed border-border text-muted"
                      : "border-border bg-card text-navy"
                  }`}
                >
                  {ex.response.answer}
                  {!ex.response.abstained && !ex.response.grounded && (
                    <div className="mt-1.5 text-xs text-negative">
                      This answer may reference something not actually in your data — double-check it.
                    </div>
                  )}
                </div>

                {ex.response.sources.length > 0 && (
                  <div className="rounded-xl border border-border bg-cream px-3 py-2">
                    <div className="text-xs font-medium text-muted">Based on</div>
                    <div className="mt-1 flex flex-col gap-1">
                      {ex.response.sources.map((s) => (
                        <div key={s.label} className="text-xs text-navy">
                          <span className="font-mono text-muted">[{s.label}]</span> {s.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!ex.response && !ex.error && i === exchanges.length - 1 && (
              <div className="self-start rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-2.5 text-sm text-muted">
                Thinking…
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your spending…"
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={!question.trim() || ask.isPending}
          className="rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
