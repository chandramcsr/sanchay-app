// Shared route/icon definitions for AppNav (see app-nav.tsx) -- one
// nav component for every breakpoint, so this is the single source
// both the mobile bottom bar and the desktop sidebar read from.
// Exactly 3 tabs + a center FAB (see AppNav), matching the requested
// nav shape directly -- Recurring isn't a primary tab; it's linked
// from the Activity page instead, where it naturally belongs (it's
// the thing that produces transactions).
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
    label: "Activity",
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
