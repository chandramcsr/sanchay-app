// Port of ledger-app's src/lib/budgetAllocation.ts -- same math,
// same reasoning throughout (see original comments preserved below).

export interface AllocationSlice {
  name: string;
  value: number;
  color: string;
}

export interface AllocationResult {
  slices: AllocationSlice[];
  total: number;
}

/**
 * How much of this month's income is spoken for by category budget
 * limits, plus an "Unallocated" slice for whatever's left over.
 *
 * Returns null when income is zero or negative -- percentages of a
 * non-positive denominator aren't meaningful, so the caller should
 * show nothing rather than a chart with NaN/Infinity slices.
 *
 * When budgeted limits exceed income (you've promised more to
 * categories than you've actually earned this month), `total` is the
 * larger of the two so slices sum to <=100% of the chart rather than
 * overflowing past a full circle -- and there's deliberately no
 * "Unallocated" slice in that case, since there's nothing left over.
 */
export function computeBudgetAllocation(
  categories: { name: string; color: string }[],
  budgets: Record<string, number>,
  monthIncome: number,
  unallocatedColor = "#C7CDD1",
): AllocationResult | null {
  if (monthIncome <= 0) return null;

  const slices: AllocationSlice[] = categories
    .filter((c) => (budgets[c.name] ?? 0) > 0)
    .map((c) => ({ name: c.name, value: budgets[c.name]!, color: c.color }));

  const allocated = slices.reduce((s, x) => s + x.value, 0);
  const unallocated = monthIncome - allocated;
  if (unallocated > 0.005) {
    slices.push({ name: "Unallocated", value: unallocated, color: unallocatedColor });
  }

  return { slices, total: Math.max(monthIncome, allocated) };
}

export interface AllocationArc extends AllocationSlice {
  pct: number;
  startAngle: number;
  endAngle: number;
}

/**
 * Assigns each slice its percentage and [startAngle, endAngle) in
 * degrees (0 = 12 o'clock, clockwise), in order. Pure prefix-sum, no
 * mutable accumulator.
 */
export function computeAllocationArcs(slices: AllocationSlice[], total: number): AllocationArc[] {
  const endAngles = slices.reduce<number[]>((acc, s) => {
    const prevEnd = acc.length ? acc[acc.length - 1]! : 0;
    acc.push(prevEnd + (s.value / total) * 360);
    return acc;
  }, []);
  return slices.map((s, i) => ({
    ...s,
    pct: (s.value / total) * 100,
    startAngle: i === 0 ? 0 : endAngles[i - 1]!,
    endAngle: endAngles[i]!,
  }));
}
