"use client";

import { useState } from "react";
import Link from "next/link";

import { useAccounts, useBudgets, useCreateAccount, useDeleteAccount } from "~/lib/queries";
import { formatMoney, ACCOUNT_TYPE_LABELS } from "~/lib/format";
import type { AccountType } from "~/lib/types";

const ACCOUNT_TYPES: AccountType[] = ["checking", "savings", "credit_card", "loan", "investment"];

export default function AccountsPage() {
  const { data: accounts, isLoading, isError } = useAccounts();
  const { data: budgets } = useBudgets();
  const createAccount = useCreateAccount();
  const deleteAccount = useDeleteAccount();
  const [formOpen, setFormOpen] = useState(false);

  const netWorth = accounts?.reduce((sum, a) => sum + a.current_balance, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-navy px-6 py-8 text-white">
        <div className="text-sm text-white/60">Net Worth · All Accounts</div>
        <div className="font-mono text-4xl font-medium tabular-nums">
          {isLoading ? "—" : formatMoney(netWorth)}
        </div>
      </div>

      {budgets && budgets.length > 0 && (
        <div className="rounded-2xl bg-card border border-border px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="font-display text-lg font-bold text-navy">Budgets</div>
            <Link href="/budgets" className="text-sm font-medium text-navy underline decoration-gold underline-offset-4">
              Manage
            </Link>
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {budgets.slice(0, 3).map((b) => {
              const pct = b.monthly_limit > 0 ? Math.min(b.spent / b.monthly_limit, 1) : 0;
              const overBudget = b.spent > b.monthly_limit;
              return (
                <div key={b.id}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-navy">{b.category}</span>
                    <span className={`font-mono tabular-nums ${overBudget ? "text-negative" : "text-muted"}`}>
                      {formatMoney(b.spent)} / {formatMoney(b.monthly_limit)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream">
                    <div
                      className={`h-full rounded-full ${overBudget ? "bg-negative" : "bg-gold"}`}
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(!budgets || budgets.length === 0) && (
        <Link
          href="/budgets"
          className="block rounded-xl border border-dashed border-border px-4 py-3 text-center text-sm font-medium text-muted transition hover:border-gold hover:text-navy"
        >
          Set a budget to start tracking spending
        </Link>
      )}

      {isError && (
        <div className="rounded-xl border border-negative/30 bg-negative/5 px-4 py-3 text-sm text-negative">
          Couldn&apos;t load your accounts. Check your connection and try again.
        </div>
      )}

      {isLoading && <div className="text-sm text-muted">Loading accounts…</div>}

      {accounts && accounts.length === 0 && !formOpen && (
        <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-navy">No accounts yet.</p>
          <p className="mt-1 text-sm text-muted">Add your first account to start tracking balances.</p>
        </div>
      )}

      {accounts && accounts.length > 0 && (
        <div className="flex flex-col gap-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between rounded-xl bg-card border border-border px-5 py-4"
            >
              <div>
                <div className="font-medium text-navy">{account.name}</div>
                <div className="text-xs text-muted">{ACCOUNT_TYPE_LABELS[account.type]}</div>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className={`font-mono text-lg tabular-nums ${
                    account.current_balance < 0 ? "text-negative" : "text-navy"
                  }`}
                >
                  {formatMoney(account.current_balance, account.currency)}
                </div>
                <button
                  onClick={() => deleteAccount.mutate(account.id)}
                  disabled={deleteAccount.isPending}
                  className="text-xs text-muted transition hover:text-negative disabled:opacity-50"
                  aria-label={`Delete ${account.name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen ? (
        <AddAccountForm
          onCancel={() => setFormOpen(false)}
          onSubmit={(input) => {
            createAccount.mutate(input, { onSuccess: () => setFormOpen(false) });
          }}
          submitting={createAccount.isPending}
          error={createAccount.isError ? "Couldn't create that account. Try again." : null}
        />
      ) : (
        <button
          onClick={() => setFormOpen(true)}
          className="rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-navy transition hover:border-gold"
        >
          + Add account
        </button>
      )}
    </div>
  );
}

function AddAccountForm({
  onCancel,
  onSubmit,
  submitting,
  error,
}: {
  onCancel: () => void;
  onSubmit: (input: { name: string; type: AccountType; starting_balance: number; currency: string }) => void;
  submitting: boolean;
  error: string | null;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("checking");
  const [startingBalance, setStartingBalance] = useState("0");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, type, starting_balance: Number(startingBalance) || 0, currency: "USD" });
      }}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Account name</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Chase Checking"
          className="rounded-lg border border-border px-3 py-2 outline-none focus:border-gold"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Type</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AccountType)}
          className="rounded-lg border border-border px-3 py-2 outline-none focus:border-gold"
        >
          {ACCOUNT_TYPES.map((t) => (
            <option key={t} value={t}>
              {ACCOUNT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Starting balance</span>
        <input
          type="number"
          step="0.01"
          value={startingBalance}
          onChange={(e) => setStartingBalance(e.target.value)}
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
          {submitting ? "Adding…" : "Add account"}
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
