// Shared route/icon definitions for AppNav (see app-nav.tsx) -- one
// nav component for every breakpoint, so this is the single source
// both the mobile bottom bar and the desktop sidebar read from.
// Home / Activity / Accounts + a center FAB (see AppNav) -- Budgets
// and Settings are reachable from Accounts rather than being their
// own primary tabs, matching the requested structure directly.
export const ROUTES = [
  {
    href: "/home",
    label: "Home",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/transactions",
    label: "Activity",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
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
] as const;
