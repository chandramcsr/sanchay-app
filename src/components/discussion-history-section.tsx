"use client";

import { useState } from "react";

import {
  useDeleteDiscussion,
  useDiscussion,
  useDiscussions,
  useRenameDiscussion,
} from "~/lib/queries";
import { DiscussionAnalysisView } from "~/components/discussion-analysis-view";
import { DiscussionRecorderModal } from "~/components/discussion-recorder-modal";
import type { Discussion } from "~/lib/types";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

// Ported from ledger-app's DiscussionHistoryModal.tsx as-is -- opens a
// blank print-formatted window client-side, no backend involvement.
function printDiscussion(d: Discussion) {
  const w = window.open("", "_blank");
  if (!w) return;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const section = (label: string, items: string[]) =>
    `<h3>${label}</h3><ul>${items.length ? items.map((i) => `<li>${esc(i)}</li>`).join("") : "<li>None detected</li>"}</ul>`;
  const a = d.analysis;
  w.document.write(`
    <html><head><title>${esc(d.title)}</title>
    <style>
      body { font-family: -apple-system, Inter, sans-serif; max-width: 640px; margin: 40px auto; color: #1C2541; line-height: 1.5; }
      h1 { font-size: 22px; margin-bottom: 4px; }
      .meta { color: #6B7280; font-size: 13px; margin-bottom: 24px; }
      h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.04em; color: #6B7280; margin-top: 28px; }
      h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.03em; color: #6B7280; margin: 18px 0 6px; }
      ul { margin: 0; padding-left: 20px; } li { margin-bottom: 4px; font-size: 14px; }
      .transcript { white-space: pre-wrap; font-size: 13px; background: #F3F5F3; border-radius: 8px; padding: 12px; }
    </style></head><body>
      <h1>${esc(d.title)}</h1>
      <div class="meta">${esc(fmtDate(d.created_at))} · ${esc(fmtDuration(d.duration_seconds))}</div>
      ${
        a
          ? `
        <h2>AI Analysis</h2>
        ${section("Executive summary", a.summary)}
        ${section("Key decisions", a.decisions)}
        <h3>Action items</h3><ul>${a.actions.length ? a.actions.map((x) => `<li><b>${esc(x.owner)}</b>: ${esc(x.task)}</li>`).join("") : "<li>None detected</li>"}</ul>
        ${section("Risks", a.risks)}
        ${section("Suggestions", a.suggestions)}
        ${section("Open questions", a.questions)}
        <h3>Sentiment</h3><p>Positive ${a.sentiment.pos}% · Neutral ${a.sentiment.neu}% · Negative ${a.sentiment.neg}%</p>
      `
          : ""
      }
      <h2>Transcript</h2>
      <div class="transcript">${esc(d.transcript)}</div>
    </body></html>
  `);
  w.document.close();
  w.focus();
  w.print();
}

export function DiscussionHistorySection() {
  const { data: discussions, isLoading, isError } = useDiscussions();
  const [openId, setOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [recorderOpen, setRecorderOpen] = useState(false);

  const { data: openDiscussion } = useDiscussion(openId);
  const renameDiscussion = useRenameDiscussion();
  const deleteDiscussion = useDeleteDiscussion();

  function rename(id: string, newTitle: string) {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      setRenamingId(null);
      return;
    }
    renameDiscussion.mutate({ id, title: trimmed }, { onSuccess: () => setRenamingId(null) });
  }

  function remove(id: string) {
    deleteDiscussion.mutate(id, {
      onSuccess: () => {
        setConfirmDeleteId(null);
        if (openId === id) setOpenId(null);
      },
    });
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Record a discussion — the recording and analysis happen entirely on your device, only the result
          gets saved.
        </p>
      </div>

      <button
        onClick={() => setRecorderOpen(true)}
        className="self-start rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
      >
        ● Record new discussion
      </button>

      {isError && (
        <div className="rounded-xl border border-negative/30 bg-negative/5 px-4 py-3 text-sm text-negative">
          Couldn&apos;t load your discussions. Check your connection and try again.
        </div>
      )}

      {isLoading && <div className="text-sm text-muted">Loading…</div>}

      {discussions && discussions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-navy">No discussions saved yet.</p>
          <p className="mt-1 text-sm text-muted">Record one above to see it here.</p>
        </div>
      )}

      {discussions && discussions.length > 0 && (
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {discussions.map((d) => (
            <div key={d.id} className="rounded-xl border border-border bg-cream px-4 py-3">
              {renamingId === d.id ? (
                <input
                  autoFocus
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onBlur={() => rename(d.id, draftTitle)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") rename(d.id, draftTitle);
                    if (e.key === "Escape") setRenamingId(null);
                  }}
                  className="w-full rounded-lg border border-border px-3 py-1.5 text-sm outline-none focus:border-gold"
                />
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setOpenId(openId === d.id ? null : d.id)}
                    className="flex-1 text-left"
                  >
                    <div className="text-sm font-medium text-navy">{d.title}</div>
                    <div className="text-xs text-muted">
                      {fmtDate(d.created_at)} · {fmtDuration(d.duration_seconds)}
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => {
                        setRenamingId(d.id);
                        setDraftTitle(d.title);
                      }}
                      aria-label="Rename"
                      className="rounded p-1.5 text-muted transition hover:text-navy"
                    >
                      ✎
                    </button>
                    {confirmDeleteId === d.id ? (
                      <button
                        onClick={() => remove(d.id)}
                        disabled={deleteDiscussion.isPending}
                        className="rounded px-2 py-1 text-xs font-medium text-negative"
                      >
                        Confirm?
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(d.id)}
                        aria-label="Delete"
                        className="rounded p-1.5 text-muted transition hover:text-negative"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              )}

              {openId === d.id && openDiscussion && (
                <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
                  <button
                    onClick={() => printDiscussion(openDiscussion)}
                    className="self-start rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-navy transition hover:border-gold"
                  >
                    ⇩ Print / Save as PDF
                  </button>
                  {openDiscussion.analysis ? (
                    <DiscussionAnalysisView analysis={openDiscussion.analysis} />
                  ) : (
                    <p className="text-sm text-muted">No analysis was generated for this discussion.</p>
                  )}
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted">Full transcript</div>
                    <div className="mt-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-navy">
                      {openDiscussion.transcript}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {recorderOpen && <DiscussionRecorderModal onClose={() => setRecorderOpen(false)} />}
    </div>
  );
}
