"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ROUTES } from "~/components/nav-links";

/**
 * One nav component, two layouts -- matching ledger-app's actual
 * responsive pattern: below md, a fixed bottom icon+label bar with a
 * center FAB; from md up, the SAME bar becomes a fixed left sidebar
 * (vertical icon+label list, FAB inline in the flow) -- not a
 * different nav design, the same one repositioned, same as
 * ledger-app's own CSS grid transform (bottom-nav becoming a sidebar
 * via grid-template-areas).
 *
 * The FAB navigates to /transactions?new=true rather than opening a
 * global modal -- TransactionsPage reads that query param and opens
 * its existing add-transaction form on mount. Keeps "add a
 * transaction from anywhere" without needing a second, parallel form
 * implementation living outside the Activity page.
 */
export function AppNav() {
  const pathname = usePathname();
  const [first, second, third] = ROUTES;

  const navLink = (route: (typeof ROUTES)[number]) => {
    const active = pathname.startsWith(route.href);
    return (
      <Link
        key={route.href}
        href={route.href}
        className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition ${
          active ? "text-gold" : "text-muted"
        }`}
      >
        {route.icon}
        {route.label}
      </Link>
    );
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t border-border bg-card py-2 md:inset-y-0 md:left-0 md:right-auto md:bottom-auto md:w-24 md:flex-col md:justify-start md:gap-6 md:border-t-0 md:border-r md:pt-8"
      style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
    >
      {navLink(first)}
      {navLink(second)}
      <Link
        href="/transactions?new=true"
        aria-label="Add transaction"
        className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white shadow-lg transition active:scale-95 md:mt-0"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </Link>
      {navLink(third)}
    </nav>
  );
}
