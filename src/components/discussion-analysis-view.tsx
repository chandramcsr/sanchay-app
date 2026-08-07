import type { DiscussionAnalysis } from "~/lib/types";

/**
 * Ported from ledger-app's DiscussionAnalysisView.tsx directly --
 * same section structure and emoji labels, restyled with Sanchay's
 * navy/gold/cream palette instead of ledger-app's own CSS variables.
 */
export function DiscussionAnalysisView({ analysis }: { analysis: DiscussionAnalysis }) {
  return (
    <div className="flex flex-col gap-4">
      <Section label="📝 Executive summary" items={analysis.summary} />
      <Section label="🎯 Key decisions" items={analysis.decisions} />

      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-muted">✅ Action items</div>
        <ul className="mt-1 flex flex-col gap-1 text-sm text-navy">
          {analysis.actions.length === 0 && <li className="text-muted">None detected</li>}
          {analysis.actions.map((a, i) => (
            <li key={i}>
              <span className="font-medium text-gold">{a.owner}</span> {a.task}
            </li>
          ))}
        </ul>
      </div>

      <Section label="⚠️ Risks" items={analysis.risks} />
      <Section label="💡 Suggestions" items={analysis.suggestions} />

      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-muted">📊 Sentiment</div>
        <div className="mt-1.5 flex h-2 overflow-hidden rounded-full">
          <div className="bg-positive" style={{ width: `${analysis.sentiment.pos}%` }} />
          <div className="bg-muted/40" style={{ width: `${analysis.sentiment.neu}%` }} />
          <div className="bg-negative" style={{ width: `${analysis.sentiment.neg}%` }} />
        </div>
        <div className="mt-1 flex gap-3 text-xs text-muted">
          <span>Positive {analysis.sentiment.pos}%</span>
          <span>Neutral {analysis.sentiment.neu}%</span>
          <span>Negative {analysis.sentiment.neg}%</span>
        </div>
      </div>

      <Section label="❓ Open questions" items={analysis.questions} />
    </div>
  );
}

function Section({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <ul className="mt-1 flex flex-col gap-1 text-sm text-navy">
        {items.length === 0 && <li className="text-muted">None detected</li>}
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
