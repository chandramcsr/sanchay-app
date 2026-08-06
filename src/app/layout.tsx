import "~/styles/globals.css";

import { ClerkProvider, Show, SignInButton, UserButton } from "@clerk/nextjs";
import { type Metadata } from "next";

import { QueryProvider } from "~/components/query-provider";
import { NavLinks } from "~/components/nav-links";

export const metadata: Metadata = {
  title: "Sanchay",
  description: "Personal finance, server-backed.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="font-sans">
          <header className="flex items-center justify-between bg-navy px-6 py-4 text-white">
            <div className="flex items-center gap-8">
              <span className="font-display text-lg font-bold tracking-tight">Sanchay</span>
              <Show when="signed-in">
                <NavLinks />
              </Show>
            </div>
            <Show when="signed-out">
              <SignInButton>
                <button className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-navy transition hover:opacity-90">
                  Sign in
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
          <QueryProvider>
            <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
