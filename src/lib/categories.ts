// Mirrored from ledger-app's src/types.ts CATS constant exactly (names,
// icons, and colors) -- a category isn't just a matching name between
// the two apps, it's the same visual identity too.

export interface CategoryDef {
  name: string;
  color: string;
  icon: string;
}

export const EXPENSE_CATEGORY_DEFS: CategoryDef[] = [
  { name: "Housing", color: "#8C5E3C", icon: "🏠" },
  { name: "Groceries", color: "#5E8B3C", icon: "🛒" },
  { name: "Dining Out", color: "#B5482E", icon: "🍽️" },
  { name: "Food", color: "#C96A3B", icon: "🍎" },
  { name: "Transport", color: "#5C6B73", icon: "🚗" },
  { name: "Utilities", color: "#7C8B5E", icon: "💡" },
  { name: "Health", color: "#9C5A6B", icon: "🩺" },
  { name: "Personal Care", color: "#B8869C", icon: "🧴" },
  { name: "Education", color: "#3C6E8C", icon: "📚" },
  { name: "Entertainment", color: "#C9962B", icon: "🎬" },
  { name: "Subscriptions", color: "#8A6FBF", icon: "🔁" },
  { name: "Shopping", color: "#5E5C8B", icon: "🛍️" },
  { name: "Travel", color: "#2B8C8C", icon: "✈️" },
  { name: "Family Support", color: "#A34D6B", icon: "👨‍👩‍👧" },
  { name: "Insurance", color: "#6B7A99", icon: "🛡️" },
  { name: "Gifts & Donations", color: "#C25B8A", icon: "🎁" },
  { name: "Other", color: "#8A8A8A", icon: "📦" },
];

export const INCOME_CATEGORY_DEFS: CategoryDef[] = [
  { name: "Salary", color: "#2F855A", icon: "💼" },
  { name: "Investment", color: "#2B6CB0", icon: "📈" },
  { name: "Refunds", color: "#4D8B7A", icon: "💸" },
  { name: "Other", color: "#5E8B6E", icon: "📦" },
];

export const EXPENSE_CATEGORIES = EXPENSE_CATEGORY_DEFS.map((c) => c.name) as [string, ...string[]];
export const INCOME_CATEGORIES = INCOME_CATEGORY_DEFS.map((c) => c.name) as [string, ...string[]];

export type TransactionType = "expense" | "income";

/**
 * A category name is ambiguous on its own -- "Other" exists in both
 * expense and income -- so lookups need to know which list to check
 * first, same as ledger-app's own categoryIcon() falling back through
 * expense then income. Defaults to a plain box for anything
 * unrecognized (a category typed before this vocabulary existed, or a
 * future addition neither list has caught up to yet).
 */
export function categoryIcon(name: string | null | undefined): string {
  if (!name) return "📦";
  return (
    EXPENSE_CATEGORY_DEFS.find((c) => c.name === name)?.icon ??
    INCOME_CATEGORY_DEFS.find((c) => c.name === name)?.icon ??
    "📦"
  );
}
