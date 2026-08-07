"use client";

import { useState } from "react";

import { EXPENSE_CATEGORY_DEFS, INCOME_CATEGORY_DEFS, type TransactionType } from "~/lib/categories";
import { groupAccountsByType } from "~/lib/format";
import { AccountTypeIcon } from "~/components/account-type-icon";
import type { AccountType, RecurringFrequency } from "~/lib/types";

const REPEATS_OPTIONS: { value: "never" | RecurringFrequency; label: string }[] = [
  { value: "never", label: "Never" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

// How many category pills show before the "More" expander -- matches
// the reference's 8-visible-plus-expandable layout.
const VISIBLE_CATEGORY_COUNT = 8;

export function AddTransactionForm({
  accounts,
  onSubmitTransaction,
  onSubmitRecurring,
  onCancel,
  submitting,
  error,
}: {
  accounts: { id: string; name: string; type: AccountType }[];
  onSubmitTransaction: (input: {
    account_id: string;
    amount: number;
    description?: string;
    category?: string;
    date: string;
  }) => void;
  onSubmitRecurring: (input: {
    account_id: string;
    amount: number;
    description?: string;
    category?: string;
    frequency: RecurringFrequency;
    start_date: string;
  }) => void;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const accountGroups = groupAccountsByType(accounts);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORY_DEFS[0]!.name);
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [repeats, setRepeats] = useState<"never" | RecurringFrequency>("never");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const categoryDefs = type === "expense" ? EXPENSE_CATEGORY_DEFS : INCOME_CATEGORY_DEFS;
  const visibleCategories = showMoreCategories ? categoryDefs : categoryDefs.slice(0, VISIBLE_CATEGORY_COUNT);
  const hiddenCount = categoryDefs.length - VISIBLE_CATEGORY_COUNT;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const magnitude = Math.abs(Number(amount) || 0);
        const signedAmount = type === "expense" ? -magnitude : magnitude;
        // description is genuinely optional now (backend column is
        // nullable) -- send undefined when left blank so it actually
        // stores as null, rather than silently substituting a value
        // the person didn't type. Display-side, lists fall back to
        // showing the category name for a null description (see
        // categoryIcon/description fallbacks in the list views) --
        // that's a rendering choice, not stored data.
        const trimmedDescription = description.trim() || undefined;
        if (repeats === "never") {
          onSubmitTransaction({
            account_id: accountId,
            amount: signedAmount,
            description: trimmedDescription,
            category,
            date,
          });
        } else {
          // A schedule, not a one-time entry -- the first occurrence
          // materializes into a real transaction automatically next
          // time the app loads data (see materialize_due_transactions
          // on the backend), same as any other recurring rule. No
          // separate one-off transaction is created here alongside it.
          onSubmitRecurring({
            account_id: accountId,
            amount: signedAmount,
            description: trimmedDescription,
            category,
            frequency: repeats,
            start_date: date,
          });
        }
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex gap-2">
        {(["expense", "income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              setCategory(t === "expense" ? EXPENSE_CATEGORY_DEFS[0]!.name : INCOME_CATEGORY_DEFS[0]!.name);
              setShowMoreCategories(false);
            }}
            className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
              type === t ? "border-navy bg-navy text-white" : "border-border text-muted hover:border-navy"
            }`}
          >
            {t === "expense" ? "Expense" : "Income"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Amount</span>
          <div className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 focus-within:border-gold">
            <span className="font-mono text-lg text-muted">$</span>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border-none bg-transparent font-mono text-lg outline-none"
            />
          </div>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Date</span>
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 font-mono outline-none focus:border-gold md:mt-[1px]"
          />
        </label>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        <span className="text-muted">Account</span>
        {accountGroups.map((group) => (
          <div key={group.type} className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">{group.label}</span>
            <div className="flex flex-wrap gap-2">
              {group.entries.map(({ account, label }) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => setAccountId(account.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    accountId === account.id
                      ? "border-navy bg-navy text-white"
                      : "border-border text-navy hover:border-gold"
                  }`}
                >
                  <AccountTypeIcon type={account.type} size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Note (optional)</span>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Whole Foods run"
          className="rounded-lg border border-border px-3 py-2 outline-none focus:border-gold"
        />
      </label>

      <div className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Category</span>
        <div className="flex flex-wrap gap-2">
          {visibleCategories.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setCategory(c.name)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                category === c.name ? "border-navy bg-navy text-white" : "border-border text-navy hover:border-gold"
              }`}
            >
              <span aria-hidden="true">{c.icon}</span>
              {c.name}
            </button>
          ))}
          {!showMoreCategories && hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowMoreCategories(true)}
              className="rounded-full border border-dashed border-border px-3 py-1.5 text-sm font-medium text-muted transition hover:border-gold"
            >
              More ▾ ({hiddenCount})
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Repeats</span>
        <div className="flex flex-wrap gap-2">
          {REPEATS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRepeats(opt.value)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                repeats === opt.value
                  ? "border-navy bg-navy text-white"
                  : "border-border text-navy hover:border-gold"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {repeats !== "never" && (
          <p className="mt-1 text-xs text-muted">
            Creates a schedule starting on the date below -- due occurrences are added automatically, they
            don&apos;t need to be logged one by one.
          </p>
        )}
      </div>

      {error && <p className="text-sm text-negative">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-navy px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save transaction"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-3 text-sm font-medium text-muted transition hover:text-navy"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
