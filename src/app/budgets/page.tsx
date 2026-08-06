"use client";

import { useState } from "react";

import { useBudgets, useDeleteBudget, useTransactions, useUpsertBudget } from "~/lib/queries";
import { formatMoney } from "~/lib/format";
import { EXPENSE_CATEGORY_DEFS, type CategoryDef } from "~/lib/categories";
import { computeBudgetAllocation } from "~/lib/budget-allocation";
import { BudgetAllocationChart } from "~/components/budget-allocation-chart";
import { SavingsGoalsSection } from "~/components/savings-goals-section";

function monthStartIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function BudgetsPage() {
  const { data: budgets, isLoading, isError } = useBudgets();
  const { data: monthTransactions } = useTransactions({
    startDate: monthStartIso(),
    endDate: todayIso(),
    limit: 500,
  });
  const upsertBudget = useUpsertBudget();
  const deleteBudget = useDeleteBudget();
  const [settingLimitFor, setSettingLimitFor] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const budgetedCategories = new Set((budgets ?? []).map((b) => b.category));

  const spentByCategory: Record<string, number> = {};
  for (const t of monthTransactions ?? []) {
    if (t.amount < 0 && t.category) {
      spentByCategory[t.category] = (spentByCategory[t.category] ?? 0) + Math.abs(t.amount);
    }
  }

  const unbudgetedSpend = EXPENSE_CATEGORY_DEFS.filter(
    (c) => !budgetedCategories.has(c.name) && (spentByCategory[c.name] ?? 0) > 0,
  );
  const rest = EXPENSE_CATEGORY_DEFS.filter(
    (c) => !budgetedCategories.has(c.name) && !((spentByCategory[c.name] ?? 0) > 0),
  );

  const totalLimit = (budgets ?? []).reduce((s, b) => s + b.monthly_limit, 0);
  const totalSpentBudgeted = (budgets ?? []).reduce((s, b) => s + b.spent, 0);
  const totalPct = totalLimit > 0 ? Math.min(100, (totalSpentBudgeted / totalLimit) * 100) : 0;
  const totalOver = totalSpentBudgeted > totalLimit;

  const monthIncome = (monthTransactions ?? []).filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const budgetLimitsByCategory: Record<string, number> = {};
  for (const b of budgets ?? []) budgetLimitsByCategory[b.category] = b.monthly_limit;
  const allocation = computeBudgetAllocation(EXPENSE_CATEGORY_DEFS, budgetLimitsByCategory, monthIncome);

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
          <p className="mt-1 text-sm text-muted">Set a monthly limit for a category below to start tracking it.</p>
        </div>
      )}

      {budgets && budgets.length > 0 && (
        <div className="rounded-2xl bg-navy px-6 py-6 text-white">
          <div className="text-sm text-white/60">Budgeted This Month</div>
          <div className="font-mono text-2xl font-medium tabular-nums">
            {formatMoney(totalSpentBudgeted)}{" "}
            <span className="text-base text-white/60">of {formatMoney(totalLimit)}</span>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className={`h-full rounded-full transition-all ${totalOver ? "bg-negative" : "bg-positive"}`}
              style={{ width: `${totalPct}%` }}
            />
          </div>
        </div>
      )}

      {allocation && allocation.slices.length > 0 && (
        <div className="rounded-2xl bg-card border border-border px-6 py-5">
          <div className="font-display text-lg font-bold text-navy">Budget Allocation</div>
          <p className="mt-0.5 text-sm text-muted">
            How much of this month&apos;s income (so far) is spoken for by category limits.
          </p>
          <div className="mt-3">
            <BudgetAllocationChart slices={allocation.slices} total={allocation.total} />
          </div>
        </div>
      )}

      {budgets && budgets.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-lg font-bold text-navy">Your Budgets</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {budgets.map((b) => {
              const pct = b.monthly_limit > 0 ? Math.min(100, (b.spent / b.monthly_limit) * 100) : 0;
              const over = b.spent > b.monthly_limit;
              const def = EXPENSE_CATEGORY_DEFS.find((c) => c.name === b.category);
              return (
                <div key={b.id} className="rounded-xl bg-card border border-border px-5 py-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-medium text-navy">
                      <span aria-hidden="true">{def?.icon ?? "📦"}</span>
                      {b.category}
                    </span>
                    <button
                      onClick={() => setSettingLimitFor(b.category)}
                      className="rounded-full border border-gold bg-gold/10 px-3 py-1 text-xs font-medium text-navy transition hover:bg-gold/20"
                    >
                      limit {formatMoney(b.monthly_limit)}
                    </button>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream">
                    <div
                      className={`h-full rounded-full ${over ? "bg-negative" : ""}`}
                      style={{ width: `${pct}%`, backgroundColor: over ? undefined : (def?.color ?? "#C9962B") }}
                    />
                  </div>
                  <div className={`mt-1.5 flex justify-between text-xs ${over ? "text-negative" : "text-muted"}`}>
                    <span>{formatMoney(b.spent)} spent</span>
                    <span>{over ? "over budget" : `${formatMoney(b.monthly_limit - b.spent)} left`}</span>
                  </div>
                  <div className="mt-2 flex justify-end">
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
              );
            })}
          </div>
        </div>
      )}

      {unbudgetedSpend.length > 0 && (
        <CategoryQuickList
          title="Spending Without a Budget"
          categories={unbudgetedSpend}
          spentByCategory={spentByCategory}
          onSetLimit={setSettingLimitFor}
        />
      )}

      {rest.length > 0 && (
        <div>
          <button
            onClick={() => setShowAllCategories((s) => !s)}
            className="w-full rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-navy transition hover:border-gold"
          >
            {showAllCategories ? "Hide other categories ▴" : `Add a budget for another category ▾ (${rest.length})`}
          </button>
          {showAllCategories && (
            <div className="mt-3">
              <CategoryQuickList title={null} categories={rest} spentByCategory={{}} onSetLimit={setSettingLimitFor} />
            </div>
          )}
        </div>
      )}

      {settingLimitFor && (
        <SetLimitModal
          category={settingLimitFor}
          currentLimit={budgets?.find((b) => b.category === settingLimitFor)?.monthly_limit}
          onClose={() => setSettingLimitFor(null)}
          onSubmit={(limit) => {
            upsertBudget.mutate(
              { category: settingLimitFor, monthly_limit: limit },
              { onSuccess: () => setSettingLimitFor(null) },
            );
          }}
          submitting={upsertBudget.isPending}
          error={upsertBudget.isError ? "Couldn't save that. Try again." : null}
        />
      )}

      <SavingsGoalsSection />
    </div>
  );
}

function CategoryQuickList({
  title,
  categories,
  spentByCategory,
  onSetLimit,
}: {
  title: string | null;
  categories: CategoryDef[];
  spentByCategory: Record<string, number>;
  onSetLimit: (category: string) => void;
}) {
  return (
    <div>
      {title && <h2 className="mb-3 font-display text-lg font-bold text-navy">{title}</h2>}
      <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card px-5">
        {categories.map((c) => (
          <div key={c.name} className="flex items-center justify-between py-3">
            <span className="flex items-center gap-2 text-navy">
              <span aria-hidden="true">{c.icon}</span>
              {c.name}
            </span>
            <div className="flex items-center gap-3">
              {(spentByCategory[c.name] ?? 0) > 0 && (
                <span className="font-mono text-sm tabular-nums text-muted">
                  {formatMoney(spentByCategory[c.name]!)}
                </span>
              )}
              <button
                onClick={() => onSetLimit(c.name)}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-navy transition hover:border-gold"
              >
                set limit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SetLimitModal({
  category,
  currentLimit,
  onClose,
  onSubmit,
  submitting,
  error,
}: {
  category: string;
  currentLimit: number | undefined;
  onClose: () => void;
  onSubmit: (limit: number) => void;
  submitting: boolean;
  error: string | null;
}) {
  const [limit, setLimit] = useState(currentLimit ? String(currentLimit) : "");
  const def = EXPENSE_CATEGORY_DEFS.find((c) => c.name === category);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-navy/40 sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-2xl bg-card px-5 py-5 sm:rounded-2xl"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mb-3 flex items-center gap-2">
          <span aria-hidden="true" className="text-xl">
            {def?.icon ?? "📦"}
          </span>
          <h2 className="font-display text-lg font-bold text-navy">{category}</h2>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(Number(limit) || 0);
          }}
          className="flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Monthly limit</span>
            <div className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 focus-within:border-gold">
              <span className="font-mono text-lg text-muted">$</span>
              <input
                required
                autoFocus
                type="number"
                step="0.01"
                min="0.01"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="400.00"
                className="w-full border-none bg-transparent font-mono text-lg outline-none"
              />
            </div>
          </label>

          {error && <p className="text-sm text-negative">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition hover:text-navy"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
