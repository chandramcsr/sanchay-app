import type { DiscussionActionItem, DiscussionAnalysis } from "~/lib/types";

/**
 * On-device discussion analysis. Zero cost, private by construction —
 * no transcript text ever leaves the browser. Extractive summarization
 * (word-frequency sentence scoring) plus keyword/regex classification
 * for decisions, risks, action items, suggestions, and open questions.
 *
 * Deliberately not LLM-backed: quality is "good enough to validate the
 * feature", not production-grade judgment. If/when a real LLM call is
 * wired in, only this file's `analyzeTranscript` needs to change —
 * DiscussionRecorderModal just calls it and renders the result.
 */

const STOPWORDS = new Set(
  "a an the and or but if then so to of in on for with as at by is are was were be been being this that these those it its i you we they he she your our their will would should could can may might not no yes".split(
    " "
  )
);

const DECISION_RE = /\b(decide|decided|agreed|will use|going with|let's use|approved|we'll go with)\b/i;
const RISK_RE = /\b(risk|concern|worried|downtime|delay|issue|problem|blocker|budget approval)\b/i;
const ACTION_RE = /\b(i'll|i will|will estimate|will put together|will review|need to|assign|todo|action item)\b/i;
const SUGGESTION_RE = /\b(should we|good idea|what if|suggest|recommend|could reduce|pilot)\b/i;
const QUESTION_RE = /\?\s*$/;
const SPEAKER_RE = /^([\p{L}][\p{L}\p{M}\s]{0,20}):\s*/u;

const POS_WORDS = /\b(good|great|agree|love|excited|positive|yes|nice|awesome|glad|helpful|reduce)\b/gi;
const NEG_WORDS = /\b(bad|risk|problem|concern|no|delay|worried|issue|blocker|downtime)\b/gi;

// Fallback for a chunk that's still one long unbroken run after the
// primary split — e.g. a dictated transcript with almost no
// punctuation. Breaks on commas or common clause conjunctions so the
// rest of the pipeline (scoring, keyword classification) has smaller
// units to work with instead of one undifferentiated blob.
const CLAUSE_BOUNDARY_RE = /,\s+|\s+(?=\b(?:and|so|but|because|however|also)\b)/i;
const LONG_RUN_THRESHOLD = 160;

function breakLongRun(s: string): string[] {
  if (s.length <= LONG_RUN_THRESHOLD) return [s];
  const parts = s
    .split(CLAUSE_BOUNDARY_RE)
    .map((p) => p.trim())
    .filter((p) => p.length > 3);
  return parts.length > 1 ? parts : [s];
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
    .flatMap(breakLongRun);
}

function stripSpeaker(s: string): string {
  return s.replace(SPEAKER_RE, "");
}

function getSpeaker(s: string): string | null {
  const m = SPEAKER_RE.exec(s);
  return m ? (m[1] ?? null) : null;
}

function scoreSentences(sentences: string[]): { s: string; score: number }[] {
  // \p{L} (Letter) + \p{M} (combining Mark) matches any script's words
  // correctly, not just a-z. \p{M} matters specifically for Indic
  // scripts like Telugu: a word such as "సమావేశం" is a base consonant
  // plus combining vowel signs/anusvara, which are Unicode category
  // Mn/Mc ("Mark"), not "Letter" — \p{L} alone would still silently
  // fragment every such word at each vowel sign instead of keeping it
  // as one token, which would quietly wreck word-frequency counting
  // even after fixing the original a-z-only bug.
  const WORD_RE = /[\p{L}\p{M}\p{N}']+/gu;
  const freq: Record<string, number> = {};
  sentences.forEach((s) => {
    stripSpeaker(s)
      .toLowerCase()
      .match(WORD_RE)
      ?.forEach((w) => {
        if (!STOPWORDS.has(w) && w.length > 2) freq[w] = (freq[w] ?? 0) + 1;
      });
  });
  return sentences.map((s) => {
    const words = stripSpeaker(s).toLowerCase().match(WORD_RE) ?? [];
    const score = words.reduce((acc, w) => acc + (freq[w] ?? 0), 0) / Math.max(words.length, 1);
    return { s, score };
  });
}

function dedupe<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function dedupeActions(arr: DiscussionActionItem[]): DiscussionActionItem[] {
  const seen = new Set<string>();
  const out: DiscussionActionItem[] = [];
  arr.forEach((a) => {
    if (!seen.has(a.task)) {
      seen.add(a.task);
      out.push(a);
    }
  });
  return out;
}

export function analyzeTranscript(text: string): DiscussionAnalysis {
  const sentences = splitSentences(text);
  const clean = sentences.map(stripSpeaker);

  const decisions: string[] = [];
  const risks: string[] = [];
  const actions: DiscussionActionItem[] = [];
  const suggestions: string[] = [];
  const questions: string[] = [];

  sentences.forEach((raw, i) => {
    const s = clean[i]!;
    const speaker = getSpeaker(raw);
    if (QUESTION_RE.test(s)) questions.push(s);
    if (DECISION_RE.test(s)) decisions.push(s);
    if (RISK_RE.test(s)) risks.push(s);
    if (ACTION_RE.test(s)) actions.push({ owner: speaker ?? "—", task: s });
    if (SUGGESTION_RE.test(s) && !DECISION_RE.test(s)) suggestions.push(s);
  });

  const scored = scoreSentences(clean);
  const summary = scored
    .map((o, i) => ({ ...o, i }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(3, scored.length))
    .sort((a, b) => a.i - b.i)
    .map((o) => o.s);

  const posCount = (text.match(POS_WORDS) ?? []).length;
  const negCount = (text.match(NEG_WORDS) ?? []).length;
  const total = posCount + negCount;
  const neu = total === 0 ? 100 : Math.max(0, 100 - Math.round(((posCount + negCount) / sentences.length) * 100));
  let pos = 0;
  let neg = 0;
  if (total > 0) {
    pos = Math.round((posCount / total) * (100 - neu));
    neg = 100 - neu - pos;
  }

  return {
    summary: summary.length ? summary : clean.slice(0, 3),
    decisions: dedupe(decisions).slice(0, 5),
    actions: dedupeActions(actions).slice(0, 5),
    risks: dedupe(risks).slice(0, 5),
    suggestions: dedupe(suggestions).slice(0, 4),
    questions: dedupe(questions).slice(0, 5),
    sentiment: { pos, neu, neg },
  };
}
