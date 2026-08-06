"use client";

import { useState } from "react";
import Link from "next/link";

import { useAccounts, useDeleteTransaction, useRecurringRules, useTransactions } from "~/lib/queries";
import { formatMoney, formatDate } from "~/lib/format";
import { categoryIcon, FREQUENCY_LABELS } from "~/lib/categories";

export default function TransactionsPage() {
  const { data: accounts } = useAccounts();
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const { data: transactions, isLoading, isError } = useTransactions(
    accountFilter === "all" ? undefined : { accountId: accountFilter },
  );
  const { data: recurringRules } = useRecurringRules();
  const deleteTransaction = useDeleteTransaction();

  const accountName = (id: string) => accounts?.find((a) => a.id === id)?.name ?? "—";

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

          {transactions && transactions.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
              <p className="text-navy">No transactions yet.</p>
              <p className="mt-1 text-sm text-muted">Tap the + button to log one.</p>
            </div>
          )}

          {transactions && transactions.length > 0 && (
            <div className="flex flex-col gap-2">
              {transactions.map((t) => (
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
                  <div className="flex items-center gap-4">
                    <div
                      className={`font-mono tabular-nums ${t.amount < 0 ? "text-negative" : "text-positive"}`}
                    >
                      {t.amount >= 0 ? "+" : ""}
                      {formatMoney(t.amount)}
                    </div>
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
              ))}
            </div>
          )}
        </>
      )}

      {/* Real content, not a bare link -- transactions post automatically
          based on frequency (see materialize_due_transactions), so
          there's nothing to "log" here day to day; this is a status
          view of what's scheduled, with a link to /recurring for actual
          management (create/edit/delete, end dates). */}
      {recurringRules && recurringRules.length > 0 && (
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
      )}
    </div>
  );
}
