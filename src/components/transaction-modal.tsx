"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { useAccounts, useCreateRecurringRule, useCreateTransaction } from "~/lib/queries";
import { AddTransactionForm } from "~/components/add-transaction-form";

const TransactionModalContext = createContext<{ open: () => void } | null>(null);

/**
 * Why a context instead of just local state on the Activity page: the
 * FAB lives in AppNav (rendered once, at the layout level, present on
 * every page) and needs to open this modal regardless of which page
 * you're currently on -- a real popup overlaying whatever's behind it,
 * not a navigation to a different screen. Local state scoped to one
 * page's component tree can't be reached from a sibling component
 * like AppNav; this is the plain-React way to share "open this modal"
 * across two components that aren't in the same subtree.
 */
export function useTransactionModal() {
  const ctx = useContext(TransactionModalContext);
  if (!ctx) throw new Error("useTransactionModal must be used within TransactionModalProvider");
  return ctx;
}

export function TransactionModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: accounts } = useAccounts();
  const createTransaction = useCreateTransaction();
  const createRecurringRule = useCreateRecurringRule();

  const submitting = createTransaction.isPending || createRecurringRule.isPending;
  const error =
    createTransaction.isError || createRecurringRule.isError ? "Couldn't save that. Try again." : null;

  return (
    <TransactionModalContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-navy/40 md:items-center"
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-card px-5 py-5 md:max-w-md md:rounded-2xl lg:max-w-lg"
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-navy">New transaction</h2>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="text-muted transition hover:text-navy"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {!accounts || accounts.length === 0 ? (
              <p className="text-sm text-muted">Add an account first, then log transactions against it.</p>
            ) : (
              <AddTransactionForm
                accounts={accounts}
                onCancel={() => setIsOpen(false)}
                onSubmitTransaction={(input) => {
                  createTransaction.mutate(input, { onSuccess: () => setIsOpen(false) });
                }}
                onSubmitRecurring={(input) => {
                  createRecurringRule.mutate(input, { onSuccess: () => setIsOpen(false) });
                }}
                submitting={submitting}
                error={error}
              />
            )}
          </div>
        </div>
      )}
    </TransactionModalContext.Provider>
  );
}
