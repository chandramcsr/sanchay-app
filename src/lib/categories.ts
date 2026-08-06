// Category names mirrored from ledger-app's classifier.ts (the keyword
// lists there also drive on-device auto-suggestion there; this is just
// the category vocabulary itself, kept consistent so a transaction
// categorized "Groceries" means the same thing in both apps).
export const EXPENSE_CATEGORIES = [
  "Housing",
  "Groceries",
  "Dining Out",
  "Food",
  "Transport",
  "Utilities",
  "Health",
  "Personal Care",
  "Education",
  "Entertainment",
  "Subscriptions",
  "Shopping",
  "Travel",
  "Family Support",
  "Insurance",
  "Gifts & Donations",
  "Other",
] as const;

export const INCOME_CATEGORIES = ["Salary", "Investment", "Refunds", "Other"] as const;

export type TransactionType = "expense" | "income";
