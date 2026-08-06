"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "~/lib/api";
import type {
  Account,
  AccountCreateInput,
  AccountUpdateInput,
  Budget,
  BudgetUpsertInput,
  RecurringRule,
  RecurringRuleCreateInput,
  RecurringRuleUpdateInput,
  SavingsGoal,
  SavingsGoalCreateInput,
  SavingsGoalUpdateInput,
  Transaction,
  TransactionCreateInput,
  TransactionUpdateInput,
} from "~/lib/types";

// One shared getToken-bound request function per component render --
// every hook below threads Clerk's own getToken through apiRequest
// rather than reading a token once and caching it, since Clerk's
// tokens are short-lived and refresh automatically; caching one here
// would silently start sending a stale token after expiry.

export function useAccounts() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["accounts"],
    queryFn: () => apiRequest<Account[]>("/accounts", getToken),
  });
}

export function useCreateAccount() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AccountCreateInput) =>
      apiRequest<Account>("/accounts", getToken, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useUpdateAccount() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: AccountUpdateInput & { id: string }) =>
      apiRequest<Account>(`/accounts/${id}`, getToken, { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useDeleteAccount() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/accounts/${id}`, getToken, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useTransactions(params?: { accountId?: string; startDate?: string; endDate?: string; limit?: number }) {
  const { getToken } = useAuth();
  const query = new URLSearchParams();
  if (params?.accountId) query.set("account_id", params.accountId);
  if (params?.startDate) query.set("start_date", params.startDate);
  if (params?.endDate) query.set("end_date", params.endDate);
  if (params?.limit) query.set("limit", String(params.limit));
  const search = query.toString() ? `?${query.toString()}` : "";
  return useQuery({
    queryKey: ["transactions", params?.accountId ?? "all", params?.startDate ?? "", params?.endDate ?? "", params?.limit ?? ""],
    queryFn: () => apiRequest<Transaction[]>(`/transactions${search}`, getToken),
  });
}

export function useCreateTransaction() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TransactionCreateInput) =>
      apiRequest<Transaction>("/transactions", getToken, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      // A new transaction changes both the list and every account's
      // current_balance (computed server-side from the transaction
      // sum) -- both caches need invalidating, not just the one the
      // mutation directly touched.
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateTransaction() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: TransactionUpdateInput & { id: string }) =>
      apiRequest<Transaction>(`/transactions/${id}`, getToken, { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: () => {
      // An edited amount changes the account's current_balance too --
      // same invalidation as delete, not just the transactions list.
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteTransaction() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/transactions/${id}`, getToken, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
      void queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useBudgets() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["budgets"],
    queryFn: () => apiRequest<Budget[]>("/budgets", getToken),
  });
}

export function useUpsertBudget() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BudgetUpsertInput) =>
      apiRequest<Budget>("/budgets", getToken, { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useDeleteBudget() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/budgets/${id}`, getToken, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useRecurringRules() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["recurring-rules"],
    queryFn: () => apiRequest<RecurringRule[]>("/recurring-rules", getToken),
  });
}

export function useCreateRecurringRule() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecurringRuleCreateInput) =>
      apiRequest<RecurringRule>("/recurring-rules", getToken, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: async () => {
      void queryClient.invalidateQueries({ queryKey: ["recurring-rules"] });
      // Materialization happens server-side on the next GET /accounts,
      // not at rule-creation time -- awaiting a real refetch here
      // (not just invalidating and hoping something else refetches
      // soon) is what actually runs it. Without this, a newly created
      // rule sits with zero materialized transactions until whatever
      // *else* happens to trigger a fresh accounts fetch, which could
      // be a long time or never in a single session -- exactly the
      // bug this fixes (a rule existed but Activity showed "No
      // transactions yet").
      await queryClient.refetchQueries({ queryKey: ["accounts"] });
      // Only after that completes -- not concurrently with it -- so
      // this refetch doesn't race ahead of materialization and miss
      // the transaction it just created.
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useUpdateRecurringRule() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: RecurringRuleUpdateInput & { id: string }) =>
      apiRequest<RecurringRule>(`/recurring-rules/${id}`, getToken, { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: async () => {
      void queryClient.invalidateQueries({ queryKey: ["recurring-rules"] });
      // Same reasoning as useCreateRecurringRule -- a frequency change
      // can shift what's due next, so this needs a real, awaited
      // refetch to actually run materialization, not just an
      // invalidation that hopes something else refetches soon.
      await queryClient.refetchQueries({ queryKey: ["accounts"] });
      void queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useDeleteRecurringRule() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/recurring-rules/${id}`, getToken, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring-rules"] }),
  });
}

export function useSavingsGoals() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: ["savings-goals"],
    queryFn: () => apiRequest<SavingsGoal[]>("/savings-goals", getToken),
  });
}

export function useCreateSavingsGoal() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SavingsGoalCreateInput) =>
      apiRequest<SavingsGoal>("/savings-goals", getToken, { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["savings-goals"] }),
  });
}

export function useUpdateSavingsGoal() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: SavingsGoalUpdateInput & { id: string }) =>
      apiRequest<SavingsGoal>(`/savings-goals/${id}`, getToken, { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["savings-goals"] }),
  });
}

export function useDeleteSavingsGoal() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/savings-goals/${id}`, getToken, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["savings-goals"] }),
  });
}
