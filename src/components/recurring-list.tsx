"use client";

import { useState } from "react";

import { useAccounts, useDeleteRecurringRule, useRecurringRules, useUpdateRecurringRule } from "~/lib/queries";
import { formatMoney, formatDate } from "~/lib/format";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, categoryIcon, FREQUENCY_LABELS, type TransactionType } from "~/lib/categories";
import type { RecurringFrequency, RecurringRule } from "~/lib/types";

/**
 * Full recurring-rule list with inline Edit/Delete, shared so it can
 * render directly on Activity instead of behind a separate /recurring
 * page -- there was no real reason to make editing/deleting a rule a
 * navigation away from where you'd naturally see it, the same way
 * transactions get edited inline right where they're listed.
 */
export function RecurringList() {
  const { data: accounts } = useAccounts();
  const { data: rules, isLoading, isError } = useRecurringRules();
  const updateRule = useUpdateRecurringRule();
  const deleteRule = useDeleteRecurringRule();
  const [editingId, setEditingId] = useState<string | null>(null);

  const accountName = (id: string) => accounts?.find((a) => a.id === id)?.name ?? "—";

  if (isError) {
    return (
      <div className="rounded-xl border border-negative/30 bg-negative/5 px-4 py-3 text-sm text-negative">
        Couldn&apos;t load your recurring transactions. Check your connection and try again.
      </div>
    );
  }

  if (isLoading) return <div className="text-sm text-muted">Loading…</div>;
  if (!rules || rules.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {rules.map((r) =>
        editingId === r.id ? (
          <EditRecurringForm
            key={r.id}
            rule={r}
            onCancel={() => setEditingId(null)}
            onSubmit={(input) => {
              updateRule.mutate({ id: r.id, ...input }, { onSuccess: () => setEditingId(null) });
            }}
            submitting={updateRule.isPending}
            error={updateRule.isError ? "Couldn't save that. Try again." : null}
          />
        ) : (
          <div
            key={r.id}
            className="flex items-center justify-between rounded-xl bg-card border border-border px-5 py-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl" aria-hidden="true">
                {categoryIcon(r.category)}
              </span>
              <div>
                <div className="font-medium text-navy">{r.description}</div>
                <div className="text-xs text-muted">
                  {accountName(r.account_id)} · {FREQUENCY_LABELS[r.frequency] ?? r.frequency} · since{" "}
                  {formatDate(r.start_date)}
                  {r.category && ` · ${r.category}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`font-mono tabular-nums ${r.amount < 0 ? "text-negative" : "text-positive"}`}>
                {r.amount >= 0 ? "+" : ""}
                {formatMoney(r.amount)}
              </div>
              <button
                onClick={() => setEditingId(r.id)}
                className="text-xs font-medium text-navy underline decoration-gold underline-offset-4"
              >
                Edit
              </button>
              <button
                onClick={() => deleteRule.mutate(r.id)}
                disabled={deleteRule.isPending}
                className="text-xs text-muted transition hover:text-negative disabled:opacity-50"
                aria-label={`Delete ${r.description}`}
              >
                Delete
              </button>
            </div>
          </div>
        ),
      )}
    </div>
  );
}

function EditRecurringForm({
  rule,
  onCancel,
  onSubmit,
  submitting,
  error,
}: {
  rule: RecurringRule;
  onCancel: () => void;
  onSubmit: (input: {
    amount: number;
    description: string;
    category?: string;
    frequency: RecurringFrequency;
    end_date?: string;
  }) => void;
  submitting: boolean;
  error: string | null;
}) {
  // account_id and start_date aren't editable here (see
  // RecurringRuleUpdateInput) -- changing either would mean re-deriving
  // the whole occurrence schedule from scratch, not a simple field edit.
  const [type, setType] = useState<TransactionType>(rule.amount < 0 ? "expense" : "income");
  const [amount, setAmount] = useState(String(Math.abs(rule.amount)));
  const [description, setDescription] = useState(rule.description);
  const [category, setCategory] = useState<string>(rule.category ?? EXPENSE_CATEGORIES[0]);
  const [frequency, setFrequency] = useState<RecurringFrequency>(rule.frequency);
  const [hasEndDate, setHasEndDate] = useState(!!rule.end_date);
  const [endDate, setEndDate] = useState(rule.end_date ?? "");

  const categoryOptions = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const magnitude = Math.abs(Number(amount) || 0);
        onSubmit({
          amount: type === "expense" ? -magnitude : magnitude,
          description,
          category,
          frequency,
          end_date: hasEndDate && endDate ? endDate : undefined,
        });
      }}
      className="flex flex-col gap-3 rounded-xl border border-gold bg-card px-5 py-4"
    >
      <div className="flex gap-2">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              setCategory(t === "expense" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
            }}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              type === t ? "border-navy bg-navy text-white" : "border-border text-muted hover:border-navy"
            }`}
          >
            {t === "expense" ? "Expense" : "Income"}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Description</span>
        <input
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 outline-none focus:border-gold"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Amount</span>
        <input
          required
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 font-mono outline-none focus:border-gold"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Category</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 outline-none focus:border-gold"
        >
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Frequency</span>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
          className="rounded-lg border border-border px-3 py-2 outline-none focus:border-gold"
        >
          {(Object.keys(FREQUENCY_LABELS) as RecurringFrequency[]).map((f) => (
            <option key={f} value={f}>
              {FREQUENCY_LABELS[f]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={hasEndDate}
          onChange={(e) => setHasEndDate(e.target.checked)}
          className="rounded border-border"
        />
        <span className="text-muted">Ends on a specific date</span>
      </label>
      {hasEndDate && (
        <input
          required
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 font-mono outline-none focus:border-gold"
        />
      )}

      {error && <p className="text-sm text-negative">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition hover:text-navy"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
