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

/**
 * Matches ledger-app's resolveStartingBalance exactly. For a credit
 * card or loan, the number someone types when adding the account is
 * "how much do I currently owe" -- a real-world positive amount, not
 * a signed figure they'd naturally think to negate themselves. Always
 * stores it as negative (-Math.abs, not a bare negation) so even an
 * accidental negative entry stays correctly normalized rather than
 * flipping the wrong way. Every other account type stores the entered
 * amount as-is.
 */
export function resolveStartingBalance(type: string, enteredAmount: number): number {
  if (isDebtAccountType(type)) return enteredAmount === 0 ? 0 : -Math.abs(enteredAmount);
  return enteredAmount;
}

/**
 * Nothing stops two accounts from sharing a name (a checking and a
 * credit card both reasonably called "Chase") -- anywhere accounts
 * appear in a selection list (a filter dropdown, an account picker),
 * showing the type alongside the name is what actually lets someone
 * tell them apart. But name+type together can still collide (two
 * Chase checking accounts) -- for that case, accountLabels() (plural,
 * takes the whole list) appends a numbered tiebreaker only to the
 * entries that still need one, in creation order, so labels stay
 * unique without getting verbose for the common case where a single
 * type suffix is already enough.
 */
export function accountLabels<T extends { id: string; name: string; type: string; created_at?: string }>(
  accounts: T[],
): Map<string, string> {
  const withTypeLabel = accounts.map((a) => ({
    id: a.id,
    base: `${a.name} (${ACCOUNT_TYPE_LABELS[a.type] ?? a.type})`,
  }));

  const counts: Record<string, number> = {};
  for (const a of withTypeLabel) counts[a.base] = (counts[a.base] ?? 0) + 1;

  const seen: Record<string, number> = {};
  const result = new Map<string, string>();
  for (const a of withTypeLabel) {
    if ((counts[a.base] ?? 0) <= 1) {
      result.set(a.id, a.base);
    } else {
      seen[a.base] = (seen[a.base] ?? 0) + 1;
      result.set(a.id, `${a.base} #${seen[a.base]}`);
    }
  }
  return result;
}

/**
 * Matches ledger-app's own accountsByType + <optgroup> pattern exactly
 * (HomeTab.tsx/TransactionsTab.tsx) -- native <select> can't render an
 * actual logo image inside an option, only plain text, so the real
 * disambiguation there is grouping by type under a labeled section
 * (the type shows once, as the group header, not repeated per option)
 * rather than appending "(Checking)" to every single name. Within a
 * group, ledger-app's own version doesn't handle two same-named
 * same-type accounts (e.g. two Chase checking accounts) -- this adds
 * that on top, same numbered-tiebreaker approach as accountLabels,
 * scoped per group instead of globally.
 */
export function groupAccountsByType<T extends { id: string; name: string; type: string }>(
  accounts: T[],
): { type: string; label: string; typeLabel: string; entries: { account: T; label: string }[] }[] {
  const byType = new Map<string, T[]>();
  for (const a of accounts) {
    const list = byType.get(a.type) ?? [];
    list.push(a);
    byType.set(a.type, list);
  }

  return Array.from(byType.entries()).map(([type, list]) => {
    const counts: Record<string, number> = {};
    for (const a of list) counts[a.name] = (counts[a.name] ?? 0) + 1;
    const seen: Record<string, number> = {};
    const entries = list.map((account) => {
      if ((counts[account.name] ?? 0) <= 1) return { account, label: account.name };
      seen[account.name] = (seen[account.name] ?? 0) + 1;
      return { account, label: `${account.name} #${seen[account.name]}` };
    });
    const typeLabel = ACCOUNT_TYPE_LABELS[type] ?? type;
    // label keeps the emoji prefix for native <optgroup> text content
    // (still used nowhere now that both selects are custom pickers,
    // kept in case a future native-select context needs it again);
    // typeLabel is the plain text for anywhere rendering a real
    // AccountTypeIcon SVG alongside it instead.
    return { type, label: `${ACCOUNT_TYPE_ICONS[type] ?? "🏦"} ${typeLabel}`, typeLabel, entries };
  });
}
