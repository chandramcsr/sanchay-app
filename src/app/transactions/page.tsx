"use client";

import { useState } from "react";

import { useAccounts, useCreateTransaction, useDeleteTransaction, useTransactions } from "~/lib/queries";
import { formatMoney, formatDate } from "~/lib/format";

export default function TransactionsPage() {
  const { data: accounts } = useAccounts();
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const { data: transactions, isLoading, isError } = useTransactions(
    accountFilter === "all" ? undefined : { accountId: accountFilter },
  );
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const [formOpen, setFormOpen] = useState(false);

  const accountName = (id: string) => accounts?.find((a) => a.id === id)?.name ?? "—";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-navy">Transactions</h1>
        {accounts && accounts.length > 0 && (
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-gold"
          >
            <option value="all">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}
      </div>

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
              <p className="mt-1 text-sm text-muted">Log one below.</p>
            </div>
          )}

          {transactions && transactions.length > 0 && (
            <div className="flex flex-col gap-2">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl bg-card border border-border px-5 py-3"
                >
                  <div>
                    <div className="font-medium text-navy">{t.description}</div>
                    <div className="text-xs text-muted">
                      {accountName(t.account_id)} · {formatDate(t.date)}
                      {t.category && ` · ${t.category}`}
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

          {formOpen ? (
            <AddTransactionForm
              accounts={accounts}
              onCancel={() => setFormOpen(false)}
              onSubmit={(input) => {
                createTransaction.mutate(input, { onSuccess: () => setFormOpen(false) });
              }}
              submitting={createTransaction.isPending}
              error={createTransaction.isError ? "Couldn't log that transaction. Try again." : null}
            />
          ) : (
            <button
              onClick={() => setFormOpen(true)}
              className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-navy transition hover:border-gold"
            >
              + Log transaction
            </button>
          )}
        </>
      )}
    </div>
  );
}

function AddTransactionForm({
  accounts,
  onCancel,
  onSubmit,
  submitting,
  error,
}: {
  accounts: { id: string; name: string }[];
  onCancel: () => void;
  onSubmit: (input: { account_id: string; amount: number; description: string; category?: string; date: string }) => void;
  submitting: boolean;
  error: string | null;
}) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          account_id: accountId,
          amount: Number(amount) || 0,
          description,
          category: category || undefined,
          date,
        });
      }}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Account</span>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 outline-none focus:border-gold"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Description</span>
        <input
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Groceries"
          className="rounded-lg border border-border px-3 py-2 outline-none focus:border-gold"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Amount (negative for expenses)</span>
        <input
          required
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="-42.50"
          className="rounded-lg border border-border px-3 py-2 font-mono outline-none focus:border-gold"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Category (optional)</span>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Groceries"
          className="rounded-lg border border-border px-3 py-2 outline-none focus:border-gold"
        />
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
          {submitting ? "Logging…" : "Log transaction"}
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
