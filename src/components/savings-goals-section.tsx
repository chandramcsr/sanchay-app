"use client";

import { useState } from "react";

import {
  useAccounts,
  useCreateSavingsGoal,
  useDeleteSavingsGoal,
  useSavingsGoals,
  useUpdateSavingsGoal,
} from "~/lib/queries";
import { formatMoney, formatDate, accountLabels } from "~/lib/format";
import { AccountPicker } from "~/components/account-picker";
import type { SavingsGoal } from "~/lib/types";

export function SavingsGoalsSection() {
  const { data: accounts } = useAccounts();
  const { data: goals, isLoading, isError } = useSavingsGoals();
  const createGoal = useCreateSavingsGoal();
  const updateGoal = useUpdateSavingsGoal();
  const deleteGoal = useDeleteSavingsGoal();
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | "new" | null>(null);

  const accountLabelMap = accounts ? accountLabels(accounts) : new Map<string, string>();
  const accountName = (id: string) => accountLabelMap.get(id) ?? accounts?.find((a) => a.id === id)?.name ?? "—";

  return (
    <div>
      <h2 className="mb-3 font-display text-lg font-bold text-navy">Savings Goals</h2>

      {isError && (
        <div className="rounded-xl border border-negative/30 bg-negative/5 px-4 py-3 text-sm text-negative">
          Couldn&apos;t load your savings goals. Check your connection and try again.
        </div>
      )}

      {isLoading && <div className="text-sm text-muted">Loading…</div>}

      <div className="rounded-2xl border border-border bg-card px-5 py-4">
        {goals && goals.length === 0 && (
          <p className="mb-3 text-sm text-muted">
            Track progress toward something specific — a trip, an emergency fund, a down payment — using a
            dedicated account&apos;s balance.
          </p>
        )}

        {goals && goals.length > 0 && (
          <div className="flex flex-col divide-y divide-border">
            {goals.map((g) => (
              <div key={g.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-navy">{g.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingGoal(g)}
                      className="rounded-full border border-border px-3 py-1 text-xs font-medium text-navy transition hover:border-gold"
                    >
                      edit
                    </button>
                    <button
                      onClick={() => deleteGoal.mutate(g.id)}
                      disabled={deleteGoal.isPending}
                      className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted transition hover:border-negative hover:text-negative disabled:opacity-50"
                    >
                      delete
                    </button>
                  </div>
                </div>
                <div className="mt-1 font-mono text-sm tabular-nums text-navy">
                  {formatMoney(g.current_amount)} / {formatMoney(g.target_amount)}
                  {g.target_date && ` · by ${formatDate(g.target_date)}`}
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${g.pct}%` }} />
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  {g.remaining <= 0
                    ? "Goal reached 🎉"
                    : g.projected_completion_date
                      ? `At this pace, done around ${formatDate(g.projected_completion_date)}`
                      : "Add money to this account to see a projection"}
                  {g.target_date && g.on_track_for_target_date === false && " — behind target date"}
                </p>
                <div className="mt-1 text-xs text-muted">Tracking {accountName(g.account_id)}</div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setEditingGoal("new")}
          className={`w-full rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-navy transition hover:border-gold ${
            goals && goals.length > 0 ? "mt-3" : ""
          }`}
        >
          + Add goal
        </button>
      </div>

      {editingGoal && accounts && accounts.length > 0 && (
        <GoalModal
          goal={editingGoal === "new" ? null : editingGoal}
          accounts={accounts}
          onClose={() => setEditingGoal(null)}
          onSubmit={(input) => {
            if (editingGoal === "new") {
              createGoal.mutate(input, { onSuccess: () => setEditingGoal(null) });
            } else {
              updateGoal.mutate({ id: editingGoal.id, ...input }, { onSuccess: () => setEditingGoal(null) });
            }
          }}
          submitting={createGoal.isPending || updateGoal.isPending}
          error={createGoal.isError || updateGoal.isError ? "Couldn't save that. Try again." : null}
        />
      )}

      {editingGoal && (!accounts || accounts.length === 0) && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-navy/40" onClick={() => setEditingGoal(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-card px-5 py-5">
            <p className="text-sm text-navy">Create an account first — a goal needs somewhere to track its balance.</p>
            <button
              onClick={() => setEditingGoal(null)}
              className="mt-4 w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GoalModal({
  goal,
  accounts,
  onClose,
  onSubmit,
  submitting,
  error,
}: {
  goal: SavingsGoal | null;
  accounts: { id: string; name: string; type: string }[];
  onClose: () => void;
  onSubmit: (input: { name: string; target_amount: number; target_date?: string; account_id: string }) => void;
  submitting: boolean;
  error: string | null;
}) {
  const [name, setName] = useState(goal?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(goal ? String(goal.target_amount) : "");
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? "");
  const [accountId, setAccountId] = useState(goal?.account_id ?? accounts[0]!.id);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-navy/40 sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-t-2xl bg-card px-5 py-5 sm:rounded-2xl"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        <h2 className="mb-3 font-display text-lg font-bold text-navy">{goal ? "Edit goal" : "New savings goal"}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const amt = Number(targetAmount);
            if (!name.trim() || !amt || amt <= 0) return;
            onSubmit({
              name: name.trim(),
              target_amount: amt,
              target_date: targetDate || undefined,
              account_id: accountId,
            });
          }}
          className="flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Name</span>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Trip to Goa"
              className="rounded-lg border border-border px-3 py-2 outline-none focus:border-gold"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Target amount</span>
            <div className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 focus-within:border-gold">
              <span className="font-mono text-lg text-muted">$</span>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="5000"
                className="w-full border-none bg-transparent font-mono text-lg outline-none"
              />
            </div>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Target date (optional)</span>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="rounded-lg border border-border px-3 py-2 font-mono outline-none focus:border-gold"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Track using account</span>
            <AccountPicker accounts={accounts} value={accountId} onChange={setAccountId} />
          </label>

          {error && <p className="text-sm text-negative">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Saving…" : goal ? "Save" : "Create goal"}
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
