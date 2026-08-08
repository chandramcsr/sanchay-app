"use client";

import { useState } from "react";

import { useCreateTransfer } from "~/lib/queries";
import { formatMoney } from "~/lib/format";
import { AccountPicker } from "~/components/account-picker";
import type { Account } from "~/lib/types";

/**
 * Ported from ledger-app's TransferModal (src/components/
 * AccountModals.tsx) -- same fields, same default note behavior
 * (server fills in "To <account>"/"From <account>" when left blank,
 * so this doesn't duplicate that logic client-side), same framing
 * line at the bottom. Uses Sanchay's own AccountPicker instead of
 * ledger-app's AccountChips, since that's the account-selection
 * pattern already established everywhere else in this app.
 */
export function TransferModal({ accounts, onClose }: { accounts: Account[]; onClose: () => void }) {
  const [fromId, setFromId] = useState(accounts[0]?.id ?? "");
  const [toId, setToId] = useState(accounts.find((a) => a.id !== accounts[0]?.id)?.id ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const createTransfer = useCreateTransfer();
  const fromAccount = accounts.find((a) => a.id === fromId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0 || fromId === toId) return;
    createTransfer.mutate(
      { from_account_id: fromId, to_account_id: toId, amount: value, date, note: note.trim() || undefined },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-navy/40 sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-2xl bg-card px-5 py-5 sm:rounded-2xl"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-navy">Transfer</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted transition hover:text-navy">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">From</span>
            <AccountPicker accounts={accounts} value={fromId} onChange={setFromId} exclude={toId} />
            {fromAccount && (
              <span className="text-xs text-muted">Available: {formatMoney(fromAccount.current_balance)}</span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">To</span>
            <AccountPicker accounts={accounts} value={toId} onChange={setToId} exclude={fromId} />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Amount</span>
            <div className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 focus-within:border-gold">
              <span className="font-mono text-lg text-muted">$</span>
              <input
                required
                autoFocus
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
              className="rounded-lg border border-border px-3 py-2 font-mono outline-none focus:border-gold"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Note (optional)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Credit card payment"
              className="rounded-lg border border-border px-3 py-2 outline-none focus:border-gold"
            />
          </label>

          <p className="text-xs text-muted">
            Transfers move money between your accounts — they don&apos;t count as income or spending.
          </p>

          {createTransfer.isError && <p className="text-sm text-negative">Couldn&apos;t save that. Try again.</p>}
          {fromId === toId && (
            <p className="text-sm text-negative">From and To need to be different accounts.</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={createTransfer.isPending || fromId === toId}
              className="flex-1 rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {createTransfer.isPending ? "Transferring…" : "Transfer"}
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
