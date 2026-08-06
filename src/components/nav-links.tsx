// Shared route/icon definitions for AppNav (see app-nav.tsx) -- one
// nav component for every breakpoint, so this is the single source
// both the mobile bottom bar and the desktop sidebar read from.
// Home / Activity / Accounts / Settings + a center FAB (see AppNav).
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
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M19.4 13.5a1.7 1.7 0 000-3l-.9-.2a7.5 7.5 0 00-.6-1.4l.5-.8a1.7 1.7 0 00-2.1-2.4l-.8.4a7.5 7.5 0 00-1.5-.6l-.2-.9a1.7 1.7 0 00-3 0l-.2.9a7.5 7.5 0 00-1.5.6l-.8-.4a1.7 1.7 0 00-2.1 2.4l.5.8a7.5 7.5 0 00-.6 1.4l-.9.2a1.7 1.7 0 000 3l.9.2a7.5 7.5 0 00.6 1.4l-.5.8a1.7 1.7 0 002.1 2.4l.8-.4a7.5 7.5 0 001.5.6l.2.9a1.7 1.7 0 003 0l.2-.9a7.5 7.5 0 001.5-.6l.8.4a1.7 1.7 0 002.1-2.4l-.5-.8a7.5 7.5 0 00.6-1.4z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
] as const;
