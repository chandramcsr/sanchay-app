"use client";

import Link from "next/link";

import { useTransactions } from "~/lib/queries";
import { formatMoney, formatDate } from "~/lib/format";
import { categoryIcon } from "~/lib/categories";

function monthStartIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysInCurrentMonth(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

export default function HomePage() {
  const { data: monthTransactions, isLoading, isError } = useTransactions({
    startDate: monthStartIso(),
    endDate: todayIso(),
    limit: 500,
  });

  const income = monthTransactions?.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0) ?? 0;
  const expenses = monthTransactions?.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0) ?? 0;
  const netCashFlow = income - expenses;

  const daysInMonth = daysInCurrentMonth();
  const dailyNet: number[] = Array.from({ length: daysInMonth }, () => 0);
  for (const t of monthTransactions ?? []) {
    const day = Number(t.date.slice(8, 10));
    if (day >= 1 && day <= daysInMonth) dailyNet[day - 1]! += t.amount;
  }
  const maxAbsDaily = Math.max(1, ...dailyNet.map((n) => Math.abs(n)));

  const recent = (monthTransactions ?? []).slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-navy px-6 py-8 text-white">
        <div className="text-sm text-white/60">Net Cash Flow · This Month</div>
        <div className="font-mono text-4xl font-medium tabular-nums">
          {isLoading ? "—" : formatMoney(netCashFlow)}
        </div>
        <div className="mt-2 flex gap-4 text-sm">
          <span className="text-positive">▲ {formatMoney(income)}</span>
          <span className="text-negative">▼ {formatMoney(expenses)}</span>
        </div>
      </div>

      {isError && (
        <div className="rounded-xl border border-negative/30 bg-negative/5 px-4 py-3 text-sm text-negative">
          Couldn&apos;t load your activity. Check your connection and try again.
        </div>
      )}

      <div className="rounded-2xl bg-card border border-border px-6 py-5">
        <div className="font-display text-lg font-bold text-navy">Daily Activity</div>
        <p className="mt-0.5 text-sm text-muted">Each bar is one day&apos;s net income vs. expenses.</p>
        <div className="mt-4 flex h-24 items-end gap-[2px]">
          {dailyNet.map((net, i) => {
            const heightPct = net === 0 ? 2 : Math.max(6, (Math.abs(net) / maxAbsDaily) * 100);
            return (
              <div
                key={i}
                title={`Day ${i + 1}: ${formatMoney(net)}`}
                className={`flex-1 rounded-t-sm ${net === 0 ? "bg-border" : net > 0 ? "bg-positive" : "bg-negative"}`}
                style={{ height: `${heightPct}%` }}
              />
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>1</span>
          <span>{daysInMonth}</span>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="font-display text-lg font-bold text-navy">Recent</div>
          <Link href="/transactions" className="text-sm font-medium text-navy underline decoration-gold underline-offset-4">
            See all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nothing logged yet this month.</p>
        ) : (
          <div className="mt-2 flex flex-col divide-y divide-border">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-xl" aria-hidden="true">
                    {categoryIcon(t.category)}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-navy">{t.description ?? t.category ?? "Transaction"}</div>
                    <div className="text-xs text-muted">
                      {t.category ?? "Uncategorized"} · {formatDate(t.date)}
                    </div>
                  </div>
                </div>
                <div className={`font-mono text-sm tabular-nums ${t.amount < 0 ? "text-negative" : "text-positive"}`}>
                  {t.amount >= 0 ? "+" : ""}
                  {formatMoney(t.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
