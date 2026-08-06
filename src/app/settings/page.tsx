export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-navy">Settings</h1>

      <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
        <p className="text-navy">Nothing here yet.</p>
        <p className="mt-1 text-sm text-muted">
          App-level preferences land here as they&apos;re built. For email, password, or sign-in methods, use
          the profile menu (top right).
        </p>
      </div>
    </div>
  );
}
