"use client";

import { useState } from "react";

import { useBudgets, useDeleteBudget, useUpsertBudget } from "~/lib/queries";
import { formatMoney } from "~/lib/format";

export default function BudgetsPage() {
  const { data: budgets, isLoading, isError } = useBudgets();
  const upsertBudget = useUpsertBudget();
  const deleteBudget = useDeleteBudget();
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-navy">Budgets</h1>

      {isError && (
        <div className="rounded-xl border border-negative/30 bg-negative/5 px-4 py-3 text-sm text-negative">
          Couldn&apos;t load your budgets. Check your connection and try again.
        </div>
      )}

      {isLoading && <div className="text-sm text-muted">Loading budgets…</div>}

      {budgets && budgets.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-navy">No budgets yet.</p>
          <p className="mt-1 text-sm text-muted">Set a monthly limit for a category to start tracking it.</p>
        </div>
      )}

      {budgets && budgets.length > 0 && (
        <div className="flex flex-col gap-2">
          {budgets.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-xl bg-card border border-border px-5 py-4"
            >
              <div className="font-medium text-navy">{b.category}</div>
              <div className="flex items-center gap-4">
                <div className="font-mono tabular-nums text-navy">{formatMoney(b.monthly_limit)}/mo</div>
                <button
                  onClick={() => deleteBudget.mutate(b.id)}
                  disabled={deleteBudget.isPending}
                  className="text-xs text-muted transition hover:text-negative disabled:opacity-50"
                  aria-label={`Delete ${b.category} budget`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen ? (
        <BudgetForm
          onCancel={() => setFormOpen(false)}
          onSubmit={(input) => {
            upsertBudget.mutate(input, { onSuccess: () => setFormOpen(false) });
          }}
          submitting={upsertBudget.isPending}
          error={upsertBudget.isError ? "Couldn't save that budget. Try again." : null}
        />
      ) : (
        <button
          onClick={() => setFormOpen(true)}
          className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-navy transition hover:border-gold"
        >
          + Set a budget
        </button>
      )}
    </div>
  );
}

function BudgetForm({
  onCancel,
  onSubmit,
  submitting,
  error,
}: {
  onCancel: () => void;
  onSubmit: (input: { category: string; monthly_limit: number }) => void;
  submitting: boolean;
  error: string | null;
}) {
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ category, monthly_limit: Number(limit) || 0 });
      }}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Category</span>
        <input
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Groceries"
          className="rounded-lg border border-border px-3 py-2 outline-none focus:border-gold"
        />
        <span className="text-xs text-muted">
          Setting a limit for a category you already budget for updates it, not a duplicate.
        </span>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Monthly limit</span>
        <input
          required
          type="number"
          step="0.01"
          min="0.01"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          placeholder="400.00"
          className="rounded-lg border border-border px-3 py-2 font-mono outline-none focus:border-gold"
        />
      </label>

      {error && <p className="text-sm text-negative">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save budget"}
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
