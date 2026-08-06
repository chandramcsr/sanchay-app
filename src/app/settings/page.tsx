"use client";

import { UserProfile } from "@clerk/nextjs";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-navy">Settings</h1>
      <p className="text-sm text-muted">
        Manage your email, password, and connected sign-in methods below. More tools land here as they&apos;re
        built.
      </p>
      <div className="rounded-2xl border border-border bg-card p-1">
        <UserProfile
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none w-full",
              navbar: "hidden",
              scrollBox: "border-none",
            },
          }}
        />
      </div>
    </div>
  );
}
