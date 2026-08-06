// Mirrors app/schemas/{accounts,transactions,budgets}.py in sanchay-api
// exactly -- field names and shapes must match the real API contract,
// not just look plausible. Update both sides together if either changes.

export type AccountType = "checking" | "savings" | "credit_card" | "loan" | "investment";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  starting_balance: number;
  current_balance: number;
  currency: string;
  created_at: string;
  updated_at: string | null;
}

export interface AccountCreateInput {
  name: string;
  type: AccountType;
  starting_balance?: number;
  currency?: string;
}

export interface AccountUpdateInput {
  name?: string;
  type?: AccountType;
  starting_balance?: number;
  currency?: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  amount: number; // signed: positive = income/credit, negative = expense/debit
  description: string | null;
  category: string | null;
  date: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string | null;
}

export interface TransactionCreateInput {
  account_id: string;
  amount: number;
  description?: string;
  category?: string;
  date: string;
}

// Mirrors app/schemas/transactions.py's TransactionUpdateRequest --
// account_id isn't editable here either, same reasoning as recurring
// rules: moving a transaction to a different account is a genuinely
// different operation than editing its details.
export interface TransactionUpdateInput {
  amount?: number;
  description?: string;
  category?: string;
  date?: string;
}

export interface Budget {
  id: string;
  category: string;
  monthly_limit: number;
  spent: number;
  created_at: string;
  updated_at: string | null;
}

export interface BudgetUpsertInput {
  category: string;
  monthly_limit: number;
}

export type RecurringFrequency = "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";

export interface RecurringRule {
  id: string;
  account_id: string;
  amount: number;
  description: string | null;
  category: string | null;
  frequency: RecurringFrequency;
  start_date: string;
  end_date: string | null;
  last_materialized: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface RecurringRuleCreateInput {
  account_id: string;
  amount: number;
  description?: string;
  category?: string;
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string;
}

// Mirrors app/schemas/recurring_rules.py's RecurringRuleUpdateRequest --
// account_id and start_date are deliberately not editable (changing
// either would mean re-deriving the whole occurrence schedule from
// scratch), only these fields.
export interface RecurringRuleUpdateInput {
  amount?: number;
  description?: string;
  category?: string;
  frequency?: RecurringFrequency;
  end_date?: string;
}
