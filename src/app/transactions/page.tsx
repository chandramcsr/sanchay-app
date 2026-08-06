"use client";

import { useState } from "react";
import Link from "next/link";

import { useAccounts, useDeleteTransaction, useRecurringRules, useTransactions, useUpdateTransaction } from "~/lib/queries";
import { formatMoney, formatDate } from "~/lib/format";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, categoryIcon, FREQUENCY_LABELS, type TransactionType } from "~/lib/categories";
import type { Transaction } from "~/lib/types";

export default function TransactionsPage() {
  const { data: accounts } = useAccounts();
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const { data: transactions, isLoading, isError } = useTransactions(
    accountFilter === "all" ? undefined : { accountId: accountFilter },
  );
  const { data: recurringRules } = useRecurringRules();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const [editingId, setEditingId] = useState<string | null>(null);

  const accountName = (id: string) => accounts?.find((a) => a.id === id)?.name ?? "—";

  const hasTransactions = !!transactions && transactions.length > 0;
  const hasRecurring = !!recurringRules && recurringRules.length > 0;

  // Real content, not a bare link -- transactions post automatically
  // based on frequency (see materialize_due_transactions), so there's
  // nothing to "log" here day to day; this is a status view of what's
  // scheduled, with a link to /recurring for actual management
  // (create/edit/delete, end dates). Positioned above the "no
  // transactions yet" empty state when there aren't any yet, instead
  // of always sitting below it -- with nothing else on the page, this
  // is the more useful thing to see first, not buried under an empty
  // placeholder.
  const recurringSection = hasRecurring ? (
    <div className="rounded-2xl bg-card border border-border px-5 py-4">
      <Link href="/recurring" className="font-display text-lg font-bold text-navy hover:text-gold">
        Recurring
      </Link>
      <div className="mt-2 flex flex-col divide-y divide-border">
        {recurringRules.slice(0, 3).map((r) => (
          <div key={r.id} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <span className="text-xl" aria-hidden="true">
                {categoryIcon(r.category)}
              </span>
              <div>
                <div className="text-sm font-medium text-navy">{r.description}</div>
                <div className="text-xs text-muted">{FREQUENCY_LABELS[r.frequency] ?? r.frequency}</div>
              </div>
            </div>
            <div className={`font-mono text-sm tabular-nums ${r.amount < 0 ? "text-negative" : "text-positive"}`}>
              {r.amount >= 0 ? "+" : ""}
              {formatMoney(r.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-navy">Activity</h1>

      {accounts && accounts.length > 0 && (
        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="self-start rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gold"
        >
          <option value="all">All accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      )}

      {!accounts || accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-navy">No accounts yet.</p>
          <p className="mt-1 text-sm text-muted">Add an account first, then log transactions against it.</p>
        </div>
      ) : (
        <>
          {isError && (
            <div className="rounded-xl border border-negative/30 bg-negative/5 px-4 py-3 text-sm text-negative">
              Couldn&apos;t load transactions. Check your connection and try again.
            </div>
          )}

          {isLoading && <div className="text-sm text-muted">Loading transactions…</div>}

          {!hasTransactions && recurringSection}

          {transactions && transactions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
              <p className="text-navy">No transactions yet.</p>
              <p className="mt-1 text-sm text-muted">Tap the + button to log one.</p>
            </div>
          )}

          {hasTransactions && (
            <div className="flex flex-col gap-2">
              {transactions.map((t) =>
                editingId === t.id ? (
                  <EditTransactionForm
                    key={t.id}
                    transaction={t}
                    onCancel={() => setEditingId(null)}
                    onSubmit={(input) => {
                      updateTransaction.mutate({ id: t.id, ...input }, { onSuccess: () => setEditingId(null) });
                    }}
                    submitting={updateTransaction.isPending}
                    error={updateTransaction.isError ? "Couldn't save that. Try again." : null}
                  />
                ) : (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl bg-card border border-border px-5 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl" aria-hidden="true">
                        {categoryIcon(t.category)}
                      </span>
                      <div>
                        <div className="font-medium text-navy">{t.description}</div>
                        <div className="text-xs text-muted">
                          {accountName(t.account_id)} · {formatDate(t.date)}
                          {t.category && ` · ${t.category}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`font-mono tabular-nums ${t.amount < 0 ? "text-negative" : "text-positive"}`}
                      >
                        {t.amount >= 0 ? "+" : ""}
                        {formatMoney(t.amount)}
                      </div>
                      <button
                        onClick={() => setEditingId(t.id)}
                        className="text-xs font-medium text-navy underline decoration-gold underline-offset-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTransaction.mutate(t.id)}
                        disabled={deleteTransaction.isPending}
                        className="text-xs text-muted transition hover:text-negative disabled:opacity-50"
                        aria-label={`Delete ${t.description}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}

          {hasTransactions && recurringSection}
        </>
      )}
    </div>
  );
}

function EditTransactionForm({
  transaction,
  onCancel,
  onSubmit,
  submitting,
  error,
}: {
  transaction: Transaction;
  onCancel: () => void;
  onSubmit: (input: { amount: number; description: string; category?: string; date: string }) => void;
  submitting: boolean;
  error: string | null;
}) {
  // account_id isn't editable here (see TransactionUpdateInput) --
  // moving a transaction to a different account is a genuinely
  // different operation than editing its details.
  const [type, setType] = useState<TransactionType>(transaction.amount < 0 ? "expense" : "income");
  const [amount, setAmount] = useState(String(Math.abs(transaction.amount)));
  const [description, setDescription] = useState(transaction.description);
  const [category, setCategory] = useState<string>(transaction.category ?? EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(transaction.date);

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
          date,
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
        <span className="text-muted">Date</span>
        <input
          required
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
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
