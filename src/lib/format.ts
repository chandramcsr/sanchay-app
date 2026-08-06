export function formatMoney(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function formatDate(isoDate: string): string {
  // isoDate is YYYY-MM-DD from the API -- parse as local, not UTC
  // midnight, or dates render one day early/late depending on the
  // viewer's timezone offset from UTC.
  const parts = isoDate.split("-").map(Number);
  const [y, m, d] = parts;
  if (y === undefined || m === undefined || d === undefined) return isoDate;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit Card",
  loan: "Loan",
  investment: "Investment",
};

// No per-account custom icon exists in the data model (Account only
// stores a type) -- this is a reasonable stand-in keyed off type,
// not a real per-account setting.
export const ACCOUNT_TYPE_ICONS: Record<string, string> = {
  checking: "🏦",
  savings: "🐷",
  credit_card: "💳",
  loan: "🧾",
  investment: "📈",
};

// Matches ledger-app's isDebtAccountType exactly -- credit cards and
// loans are the two account types this app's model treats as debt,
// where a balance reads more naturally as a positive "amount owed"
// than the signed negative it's actually stored as.
export function isDebtAccountType(type: string): boolean {
  return type === "credit_card" || type === "loan";
}
