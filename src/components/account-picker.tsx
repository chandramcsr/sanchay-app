"use client";

import { useEffect, useRef, useState } from "react";

import { groupAccountsByType } from "~/lib/format";
import { AccountTypeIcon } from "~/components/account-type-icon";

/**
 * Custom dropdown replacing a native <select> wherever an account
 * type icon needs to show -- native <select>/<optgroup> can only
 * render plain text (no SVG/image content inside an option), so
 * there's no way to show the real AccountTypeIcon there. This is
 * styled to read like a normal dropdown (trigger button + panel),
 * grouped by type exactly like groupAccountsByType's native-select
 * version, just with a real icon per group and per row instead of
 * emoji-in-text.
 */
export function AccountPicker<T extends { id: string; name: string; type: string }>({
  accounts,
  value,
  onChange,
  allOption,
  exclude,
  className,
}: {
  accounts: T[];
  value: string;
  onChange: (id: string) => void;
  /** e.g. { value: "all", label: "All accounts" } for a filter context; omit for a required single-account picker. */
  allOption?: { value: string; label: string };
  /** Account id to hide from the list — e.g. a Transfer's "To" picker excludes whatever "From" currently has selected, so the two can't match. */
  exclude?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const visibleAccounts = exclude ? accounts.filter((a) => a.id !== exclude) : accounts;
  const groups = groupAccountsByType(visibleAccounts);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const selectedAccount = accounts.find((a) => a.id === value);
  const selectedLabel = selectedAccount
    ? (groups.find((g) => g.type === selectedAccount.type)?.entries.find((e) => e.account.id === value)?.label ??
      selectedAccount.name)
    : (allOption?.label ?? "");

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-navy outline-none focus:border-gold"
      >
        <span className="flex items-center gap-2">
          {selectedAccount && <AccountTypeIcon type={selectedAccount.type} size={16} />}
          {selectedLabel}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-muted">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-40 mt-1 max-h-72 w-full min-w-[220px] overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-lg">
          {allOption && (
            <button
              type="button"
              onClick={() => {
                onChange(allOption.value);
                setOpen(false);
              }}
              className={`flex w-full items-center px-3 py-2 text-left text-sm transition hover:bg-cream ${
                value === allOption.value ? "font-medium text-navy" : "text-navy"
              }`}
            >
              {allOption.label}
            </button>
          )}
          {groups.map((group) => (
            <div key={group.type}>
              <div className="flex items-center gap-1.5 px-3 pt-2 pb-1 text-xs font-medium text-muted">
                <AccountTypeIcon type={group.type} size={13} />
                {group.typeLabel}
              </div>
              {group.entries.map(({ account, label }) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => {
                    onChange(account.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center px-3 py-2 pl-7 text-left text-sm transition hover:bg-cream ${
                    value === account.id ? "font-medium text-navy" : "text-navy"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
