"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const ROUTES = [
  {
    href: "/accounts",
    label: "Accounts",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/budgets",
    label: "Budgets",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

/**
 * Top nav links -- desktop only (hidden below md). Below md, BottomNav
 * (see bottom-nav.tsx) takes over as a fixed bottom tab bar, matching
 * ledger-app's own responsive pattern: bottom nav on mobile, a
 * different presentation once there's room for it. Icons shared
 * between the two (ROUTES above) so the same visual vocabulary reads
 * consistently across breakpoints, not two unrelated nav designs.
 */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="hidden gap-6 md:flex">
      {ROUTES.map((route) => {
        const active = pathname.startsWith(route.href);
        return (
          <Link
            key={route.href}
            href={route.href}
            className={`text-sm font-medium transition ${
              active ? "text-gold" : "text-white/70 hover:text-white"
            }`}
          >
            {route.label}
          </Link>
        );
      })}
    </nav>
  );
}
