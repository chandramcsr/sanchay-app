# AI vs. SQL: Decision Guide for Sanchay-app

Reference doc for deciding when a feature needs an LLM vs. plain deterministic code. Written while learning LLM fundamentals (tokens, context, temperature, structured output, function calling, model selection, eval) and applying them to Ask Sanchay.

## The one question that matters

**Is the task's shape fixed, or does it require interpreting ambiguous intent?**

- Fixed shape (known filter, known fields, known math) → SQL / backend code
- Ambiguous intent (vague phrasing, fuzzy categories, open-ended asks) → LLM — but only for the interpretation, never for the numbers

## Decision flow

```
User request comes in
   │
   ├─ Is it already structured (button, form, known filter)?
   │     └─ YES → SQL / backend code. Done.
   │
   ├─ Is it natural language but maps to exactly one query?
   │     └─ YES → simple keyword/regex router → SQL. No LLM.
   │
   ├─ Is it ambiguous (vague timeframe, fuzzy category, multiple
   │  valid interpretations)?
   │     └─ YES → LLM resolves ambiguity into a structured query
   │              (function calling), then SQL executes it.
   │
   └─ Does the answer require synthesizing several data points
      into a narrative, judgment, or recommendation?
         └─ YES → LLM reasons/phrases over SQL results.
                  LLM never computes or recalls the numbers itself.
```

**Non-negotiable rule:** wherever a number or date matters, SQL produces it. The LLM's job — when it's involved at all — is to decide *which* query to run or to *phrase* the result. It never generates a figure from its own memory.

## Applied to Sanchay-app

**Pure SQL, no AI:**
- Account balances
- Transactions in a date range
- Budget vs. actual spend per category
- Debt Payoff Planner projections (deterministic math)

**LLM for narrow classification (small/fast model):**
- Auto-category suggestion for a new expense — genuinely fuzzy, no fixed rule set, structured output like `{category, confidence}`

**LLM for intent parsing (function calling), then SQL:**
- "How much did I spend on groceries last month?" → LLM resolves "last month" and "groceries" into concrete params → SQL runs → plain formatting, no LLM needed for the output itself
- "Am I overspending anywhere?" → LLM calls budget-status per category → LLM synthesizes the summary from real results

**LLM for tone/phrasing only:**
- Budget-warning notification copy — determinism doesn't matter here, tone does

## Cost and reliability, cheapest first

1. Hardcoded logic / SQL — deterministic, free, instant, nothing to evaluate
2. Rules-based parsing (regex, keyword lookup) — cheap and deterministic, breaks on edge cases
3. Small/fast LLM (Haiku-tier) — narrow classification, intent parsing
4. Larger LLM (Sonnet-tier) — open-ended reasoning, multi-step synthesis

Default to the cheapest tier that reliably solves the task. Move down the list only when the task genuinely requires it — not because the AI version is more interesting to build.

## Red flags you're over-applying AI

- The LLM is asked to recall or compute a number a backend query should provide
- A fixed `if/else` or a small set of query templates would solve it
- The "ambiguity" is really a handful of known synonyms — a lookup table beats an LLM call
- You've added latency, cost, and non-determinism to something that was reliable as plain code

## Where AI genuinely earns its place here

- Turning ambiguous natural-language questions into structured query parameters
- Turning structured data back into natural, conversational phrasing
- Fuzzy classification with no fixed rule set
- Synthesizing multiple data points into a recommendation or summary
