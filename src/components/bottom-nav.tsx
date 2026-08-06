"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ROUTES } from "~/components/nav-links";

/**
 * Fixed bottom tab bar -- mobile only (hidden from md up, where
 * NavLinks' top nav takes over instead). This is the actual fix for
 * the real layout bug it replaced: a horizontal top nav with three
 * text links plus a user avatar has no room to breathe on a narrow
 * viewport and visibly collides ("Budgets" running into the avatar
 * circle). Icon + label, safe-area-inset-bottom padding for iOS home
 * indicator clearance, gold for the active tab -- same practical
 * pattern as ledger-app's own bottom-nav, adapted to Tailwind
 * utilities instead of ledger-app's hand-written CSS.
 */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t border-border bg-card py-2 md:hidden"
      style={{ paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
    >
      {ROUTES.map((route) => {
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
      })}
    </nav>
  );
}
