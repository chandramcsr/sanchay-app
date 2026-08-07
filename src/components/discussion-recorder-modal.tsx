"use client";

import { useEffect, useRef, useState } from "react";

import { useCreateDiscussion } from "~/lib/queries";
import { analyzeTranscript } from "~/lib/discussion-analysis";
import { DiscussionAnalysisView } from "~/components/discussion-analysis-view";
import type { DiscussionAnalysis } from "~/lib/types";

/**
 * Ported from ledger-app's DiscussionRecorderModal.tsx -- same
 * recording/pause/resume/stop state machine, same Web Speech API
 * wiring, same punctuation-insertion fix for the run-on-transcript
 * problem, same paste-transcript fallback. The one real difference:
 * ledger-app saves into its local-first synced blob (commit()); this
 * saves via useCreateDiscussion, a real POST to sanchay-api, since
 * Sanchay's storage model is server-backed, not local-first. The
 * recording and analysis themselves stay entirely on-device either
 * way -- only the already-computed result is ever sent anywhere.
 */

type Status = "idle" | "recording" | "paused" | "done";

// Web Speech API BCP-47 language tags -- same curated list as
// ledger-app, matching Sanchay's own India-focused user base rather
// than every locale Chrome technically accepts.
const RECORDING_LANGUAGES: { code: string; label: string }[] = [
  { code: "en-US", label: "English (US)" },
  { code: "en-IN", label: "English (India)" },
  { code: "te-IN", label: "Telugu" },
  { code: "hi-IN", label: "Hindi" },
  { code: "ta-IN", label: "Tamil" },
  { code: "kn-IN", label: "Kannada" },
  { code: "mr-IN", label: "Marathi" },
  { code: "bn-IN", label: "Bengali" },
];

// Minimal local typings for the Web Speech API -- not in lib.dom.d.ts,
// only needed inside this file.
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultLike[];
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtorType = new () => SpeechRecognitionLike;

function fmtTimer(ms: number): string {
  const s = Math.floor(ms / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function DiscussionRecorderModal({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [micError, setMicError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<DiscussionAnalysis | null>(null);
  const [title, setTitle] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [saved, setSaved] = useState(false);
  const [recordingLang, setRecordingLang] = useState("en-US");

  const createDiscussion = useCreateDiscussion();

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const startTimeRef = useRef(0);
  const elapsedBeforePauseRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognizingRef = useRef(false);

  const windowWithSpeech = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionCtorType;
    webkitSpeechRecognition?: SpeechRecognitionCtorType;
  };
  const SpeechRecognitionCtor = windowWithSpeech.SpeechRecognition ?? windowWithSpeech.webkitSpeechRecognition;
  const supported = !!SpeechRecognitionCtor;

  useEffect(() => {
    return () => {
      recognizingRef.current = false;
      if (tickRef.current) clearInterval(tickRef.current);
      recognitionRef.current?.stop();
    };
  }, []);

  function setupRecognition() {
    if (!SpeechRecognitionCtor) return;
    const rec = new SpeechRecognitionCtor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = recordingLang;
    rec.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        const chunk = result[0]!.transcript.trim();
        if (!chunk) continue;
        if (result.isFinal) {
          // Web Speech API returns no punctuation at all -- each
          // result entry already corresponds to one recognized
          // phrase (the engine's own pause detection), so treat that
          // boundary as a sentence boundary. Without this, a whole
          // dictation session arrives as one unbroken run-on with no
          // ./?/! anywhere, and analyzeTranscript's sentence splitter
          // (which summary/decisions/risks/actions/questions all
          // depend on) has nothing to split on.
          const endsWithPunctuation = /[.?!]$/.test(chunk);
          setFinalText((prev) => prev + chunk + (endsWithPunctuation ? " " : ". "));
        } else {
          interim += chunk;
        }
      }
      setInterimText(interim);
    };
    rec.onerror = (e: SpeechRecognitionErrorEventLike) => {
      if (e.error === "not-allowed") {
        setMicError("Microphone access was denied. Grant mic permission, or paste a transcript below instead.");
      }
    };
    rec.onend = () => {
      if (recognizingRef.current) {
        try {
          rec.start();
        } catch {
          // already running
        }
      }
    };
    recognitionRef.current = rec;
  }

  function start() {
    setFinalText("");
    setInterimText("");
    setMicError(null);
    setAnalysis(null);
    setTitle("");
    setSaved(false);
    elapsedBeforePauseRef.current = 0;
    startTimeRef.current = Date.now();
    recognizingRef.current = true;

    if (supported) {
      setupRecognition();
      try {
        recognitionRef.current?.start();
      } catch {
        // noop
      }
    }
    tickRef.current = setInterval(() => {
      setElapsedMs(elapsedBeforePauseRef.current + (Date.now() - startTimeRef.current));
    }, 1000);
    setStatus("recording");
  }

  function togglePause() {
    if (status === "recording") {
      elapsedBeforePauseRef.current += Date.now() - startTimeRef.current;
      recognitionRef.current?.stop();
      setStatus("paused");
    } else if (status === "paused") {
      startTimeRef.current = Date.now();
      try {
        recognitionRef.current?.start();
      } catch {
        // noop
      }
      setStatus("recording");
    }
  }

  function defaultTitle(a: DiscussionAnalysis): string {
    const first = a.summary[0] ?? "";
    return first.length > 60 ? first.slice(0, 57) + "…" : first || `Discussion — ${new Date().toLocaleDateString()}`;
  }

  function stop() {
    recognizingRef.current = false;
    if (tickRef.current) clearInterval(tickRef.current);
    recognitionRef.current?.stop();
    setStatus("done");
    const text = finalText.trim();
    if (text) {
      const result = analyzeTranscript(text);
      setAnalysis(result);
      setTitle(defaultTitle(result));
    }
  }

  function analyzePasted() {
    const text = pasteText.trim();
    if (!text) return;
    const result = analyzeTranscript(text);
    setAnalysis(result);
    setTitle(defaultTitle(result));
    setStatus("done");
  }

  function save() {
    const transcript = (finalText || pasteText).trim();
    if (!transcript || !analysis) return;
    createDiscussion.mutate(
      {
        title: title.trim() || defaultTitle(analysis),
        transcript,
        analysis,
        duration_seconds: Math.floor(elapsedMs / 1000),
      },
      { onSuccess: () => setSaved(true) },
    );
  }

  const transcriptText = finalText || pasteText;

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-navy/40 sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-y-auto rounded-t-2xl bg-card px-5 py-5 sm:rounded-2xl"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-navy">Discussion Recorder</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted transition hover:text-navy">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              status === "recording" || status === "paused"
                ? "bg-negative/10 text-negative"
                : status === "done"
                  ? "bg-positive/10 text-positive"
                  : "bg-cream text-muted"
            }`}
          >
            {(status === "recording" || status === "paused") && (
              <span className="h-1.5 w-1.5 rounded-full bg-negative" />
            )}
            {status === "paused" ? "PAUSED" : status.toUpperCase()}
          </span>
          <span className="font-mono text-sm tabular-nums text-navy">{fmtTimer(elapsedMs)}</span>
        </div>

        {!supported && (
          <div className="mb-3 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-xs text-navy">
            This browser doesn&apos;t support live speech recognition (Chrome/Edge only). Use &quot;Paste
            transcript&quot; below instead.
          </div>
        )}
        {micError && (
          <div className="mb-3 rounded-lg border border-negative/30 bg-negative/5 px-3 py-2 text-xs text-negative">
            {micError}
          </div>
        )}

        <label className="mb-3 flex flex-col gap-1 text-sm">
          <span className="text-muted">Recording language</span>
          <select
            value={recordingLang}
            onChange={(e) => setRecordingLang(e.target.value)}
            disabled={status === "recording" || status === "paused"}
            className="rounded-lg border border-border px-3 py-2 outline-none focus:border-gold disabled:opacity-50"
          >
            {RECORDING_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          {recordingLang !== "en-US" && recordingLang !== "en-IN" && (
            <p className="text-xs text-muted">
              Transcription works fully in this language. Decision/risk/action-item detection is tuned for
              English phrasing, so those sections may show fewer results — the summary and full transcript
              still reflect what was actually said.
            </p>
          )}
        </label>

        <div className="mb-3 flex gap-2">
          <button
            onClick={start}
            disabled={status === "recording"}
            className="flex-1 rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            ▶ Start
          </button>
          <button
            onClick={togglePause}
            disabled={status !== "recording" && status !== "paused"}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-navy transition hover:border-gold disabled:opacity-50"
          >
            {status === "paused" ? "▶ Resume" : "⏸ Pause"}
          </button>
          <button
            onClick={stop}
            disabled={status !== "recording" && status !== "paused"}
            className="flex-1 rounded-lg border border-negative/30 px-4 py-2.5 text-sm font-medium text-negative transition hover:bg-negative/5 disabled:opacity-50"
          >
            ■ Stop
          </button>
        </div>

        <div className="mb-3 flex flex-col gap-1.5">
          <span className="text-sm text-muted">Live transcript</span>
          <div className="min-h-[80px] rounded-lg border border-border bg-cream px-3 py-2 text-sm text-navy">
            {transcriptText ? (
              transcriptText
            ) : (
              <span className="text-muted">Nothing yet — hit Start and allow microphone access.</span>
            )}
            {interimText && <span className="text-muted"> {interimText}</span>}
          </div>
          <button
            onClick={() => setShowPaste((v) => !v)}
            className="self-start text-xs font-medium text-navy underline decoration-gold underline-offset-4"
          >
            {showPaste ? "Hide paste box" : "Paste transcript instead"}
          </button>
          {showPaste && (
            <div className="flex flex-col gap-2">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste a transcript to analyze without recording"
                className="min-h-[80px] rounded-lg border border-border px-3 py-2 font-mono text-xs outline-none focus:border-gold"
              />
              <button
                onClick={analyzePasted}
                className="self-start rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-navy transition hover:border-gold"
              >
                Analyze this text
              </button>
            </div>
          )}
        </div>

        {analysis && (
          <div className="flex flex-col gap-3">
            <span className="text-sm text-muted">AI analysis (on-device, no cost)</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Discussion title"
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium outline-none focus:border-gold"
            />
            <DiscussionAnalysisView analysis={analysis} />
            <button
              onClick={save}
              disabled={saved || createDiscussion.isPending}
              className="rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saved ? "Saved ✓" : createDiscussion.isPending ? "Saving…" : "Save discussion"}
            </button>
            {createDiscussion.isError && (
              <p className="text-xs text-negative">Couldn&apos;t save that. Try again.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
