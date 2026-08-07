import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-navy">Settings</h1>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold text-navy">Tools</h2>
        <Link
          href="/ask"
          className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition hover:border-gold"
        >
          <div>
            <div className="font-medium text-navy">Ask Sanchay</div>
            <div className="text-xs text-muted">Ask about your own spending, in plain language</div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-muted">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
        <p className="text-navy">Nothing else here yet.</p>
        <p className="mt-1 text-sm text-muted">
          More app-level preferences land here as they&apos;re built. For email, password, or sign-in
          methods, use the profile menu (top right).
        </p>
      </div>
    </div>
  );
}
