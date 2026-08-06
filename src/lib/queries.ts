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
  Transaction,
  TransactionCreateInput,
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["recurring-rules"] });
      // Materialization happens server-side on the next GET /accounts,
      // not at rule-creation time -- nothing to invalidate for
      // accounts/transactions yet here, only once that next fetch
      // actually runs.
    },
  });
}

export function useUpdateRecurringRule() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: RecurringRuleUpdateInput & { id: string }) =>
      apiRequest<RecurringRule>(`/recurring-rules/${id}`, getToken, { method: "PUT", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recurring-rules"] }),
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
