/**
 * Custom-drawn account-type icons, replacing the generic system emoji
 * (🏦🐷💳🧾📈) used previously. Emoji render inconsistently across
 * devices/OSes and read as informal next to the rest of the app's
 * deliberately designed navy/gold identity -- these are plain SVG,
 * same simple geometric-shape approach as the Logo component, so
 * they're consistent everywhere and don't depend on the viewer's
 * platform emoji set.
 *
 * Real third-party bank logos (an actual Chase or Citi mark) aren't
 * used here -- that would need licensing this app doesn't have, and
 * account names are free-text, not a fixed bank list to reliably
 * match against anyway. These represent the account TYPE, not the
 * specific bank.
 *
 * Native <select>/<optgroup> can't render these (HTML option/optgroup
 * content is plain text only) -- ACCOUNT_TYPE_ICONS (format.ts) still
 * provides emoji specifically for that text-only context. This
 * component is for every other place a type icon renders as a real
 * DOM element.
 */
export function AccountTypeIcon({ type, size = 20 }: { type: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none" };

  switch (type) {
    case "checking":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M3 9.5 12 4l9 5.5" stroke="var(--color-navy)" strokeWidth="1.6" strokeLinejoin="round" />
          <path
            d="M4.5 9.5h15V19a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V9.5Z"
            fill="var(--color-gold)"
            fillOpacity="0.18"
            stroke="var(--color-navy)"
            strokeWidth="1.4"
          />
          <path d="M8 13v4M12 13v4M16 13v4" stroke="var(--color-navy)" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "savings":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M5 12.5c0-3.5 3-6.5 7-6.5s6.5 2.6 7 5.5c1.2.3 2 1 2 1.8 0 1-1 1.7-2.3 1.7H18v1.5a2 2 0 0 1-2 2h-1v-1.8a8.6 8.6 0 0 1-3 .5c-.9 0-1.8-.1-2.6-.4L9 19H8a2 2 0 0 1-2-2v-1.9c-.6-.5-1-1.3-1-2.1v-.5Z"
            fill="var(--color-gold)"
            fillOpacity="0.22"
            stroke="var(--color-navy)"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <circle cx="15.5" cy="11.5" r="0.9" fill="var(--color-navy)" />
          <path d="M8.5 6.5 7 4.5M15.5 6 16.7 4" stroke="var(--color-navy)" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "credit_card":
      return (
        <svg {...common} aria-hidden="true">
          <rect
            x="3"
            y="6"
            width="18"
            height="13"
            rx="2"
            fill="var(--color-gold)"
            fillOpacity="0.18"
            stroke="var(--color-navy)"
            strokeWidth="1.4"
          />
          <path d="M3 10.5h18" stroke="var(--color-navy)" strokeWidth="1.6" />
          <path d="M6 14.5h5" stroke="var(--color-navy)" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "loan":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
            fill="var(--color-gold)"
            fillOpacity="0.18"
            stroke="var(--color-navy)"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M15 3v4h4" stroke="var(--color-navy)" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M8 12h8M8 15h8M8 18h5" stroke="var(--color-navy)" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "investment":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 19V5" stroke="var(--color-navy)" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M4 19h16" stroke="var(--color-navy)" strokeWidth="1.4" strokeLinecap="round" />
          <path
            d="M6 15.5 10 11l3 3 5.5-6"
            stroke="var(--color-positive)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path d="M15.5 8h3v3" stroke="var(--color-positive)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden="true">
          <rect
            x="3"
            y="7"
            width="18"
            height="13"
            rx="2"
            fill="var(--color-gold)"
            fillOpacity="0.18"
            stroke="var(--color-navy)"
            strokeWidth="1.4"
          />
          <path d="M3 10.5h18" stroke="var(--color-navy)" strokeWidth="1.4" />
        </svg>
      );
  }
}
