"use client";

import { useState } from "react";

import { useAccounts, useCreateRecurringRule, useDeleteRecurringRule, useRecurringRules } from "~/lib/queries";
import { formatMoney, formatDate } from "~/lib/format";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type TransactionType } from "~/lib/categories";
import type { RecurringFrequency } from "~/lib/types";

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  quarterly: "Every 3 months",
  yearly: "Yearly",
};

export default function RecurringPage() {
  const { data: accounts } = useAccounts();
  const { data: rules, isLoading, isError } = useRecurringRules();
  const createRule = useCreateRecurringRule();
  const deleteRule = useDeleteRecurringRule();
  const [formOpen, setFormOpen] = useState(false);

  const accountName = (id: string) => accounts?.find((a) => a.id === id)?.name ?? "—";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Recurring</h1>
        <p className="mt-1 text-sm text-muted">
          Rent, subscriptions, paychecks — anything on a schedule. Due occurrences are added as real
          transactions automatically next time you open the app.
        </p>
      </div>

      {!accounts || accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-navy">No accounts yet.</p>
          <p className="mt-1 text-sm text-muted">Add an account first, then set up a recurring transaction.</p>
        </div>
      ) : (
        <>
          {isError && (
            <div className="rounded-xl border border-negative/30 bg-negative/5 px-4 py-3 text-sm text-negative">
              Couldn&apos;t load your recurring transactions. Check your connection and try again.
            </div>
          )}

          {isLoading && <div className="text-sm text-muted">Loading…</div>}

          {rules && rules.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
              <p className="text-navy">Nothing recurring yet.</p>
              <p className="mt-1 text-sm text-muted">Set one up below.</p>
            </div>
          )}

          {rules && rules.length > 0 && (
            <div className="flex flex-col gap-2">
              {rules.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl bg-card border border-border px-5 py-4"
                >
                  <div>
                    <div className="font-medium text-navy">{r.description}</div>
                    <div className="text-xs text-muted">
                      {accountName(r.account_id)} · {FREQUENCY_LABELS[r.frequency]} · since{" "}
                      {formatDate(r.start_date)}
                      {r.category && ` · ${r.category}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`font-mono tabular-nums ${r.amount < 0 ? "text-negative" : "text-positive"}`}
                    >
                      {r.amount >= 0 ? "+" : ""}
                      {formatMoney(r.amount)}
                    </div>
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
              ))}
            </div>
          )}

          {formOpen ? (
            <AddRecurringForm
              accounts={accounts}
              onCancel={() => setFormOpen(false)}
              onSubmit={(input) => {
                createRule.mutate(input, { onSuccess: () => setFormOpen(false) });
              }}
              submitting={createRule.isPending}
              error={createRule.isError ? "Couldn't save that. Try again." : null}
            />
          ) : (
            <button
              onClick={() => setFormOpen(true)}
              className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-navy transition hover:border-gold"
            >
              + Add recurring transaction
            </button>
          )}
        </>
      )}
    </div>
  );
}

function AddRecurringForm({
  accounts,
  onCancel,
  onSubmit,
  submitting,
  error,
}: {
  accounts: { id: string; name: string }[];
  onCancel: () => void;
  onSubmit: (input: {
    account_id: string;
    amount: number;
    description: string;
    category?: string;
    frequency: RecurringFrequency;
    start_date: string;
    end_date?: string;
  }) => void;
  submitting: boolean;
  error: string | null;
}) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState("");

  const categoryOptions = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const magnitude = Math.abs(Number(amount) || 0);
        onSubmit({
          account_id: accountId,
          amount: type === "expense" ? -magnitude : magnitude,
          description,
          category,
          frequency,
          start_date: startDate,
          end_date: hasEndDate && endDate ? endDate : undefined,
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
          placeholder="Rent"
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
          placeholder="1500.00"
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
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Starts</span>
        <input
          required
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 font-mono outline-none focus:border-gold"
        />
        <span className="text-xs text-muted">
          Anything due since this date gets added as real transactions right away — a schedule from years ago
          catches up in full, not just from today.
        </span>
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
