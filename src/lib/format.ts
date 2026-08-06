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
