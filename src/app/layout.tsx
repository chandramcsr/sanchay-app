import "~/styles/globals.css";

import { ClerkProvider, Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { type Metadata } from "next";

import { QueryProvider } from "~/components/query-provider";
import { AppNav } from "~/components/app-nav";
import { TransactionModalProvider } from "~/components/transaction-modal";
import { Logo } from "~/components/logo";

export const metadata: Metadata = {
  title: "Sanchay",
  description: "Personal finance, server-backed.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#1C2541",
          colorBackground: "#FFFFFF",
          colorForeground: "#1C2541",
          colorMutedForeground: "#6B7280",
          colorInput: "#FFFFFF",
          colorInputForeground: "#1C2541",
          fontFamily: "var(--font-sans)",
          borderRadius: "0.75rem",
        },
      }}
    >
      <html lang="en">
        <body className="font-sans">
          <header className="flex h-16 items-center justify-between bg-navy px-6 text-white">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={32} />
              <span className="font-display text-lg font-bold tracking-tight">Sanchay</span>
            </Link>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
          <QueryProvider>
            <TransactionModalProvider>
              <main className="mx-auto max-w-3xl px-6 py-8 pb-24 md:pb-8 md:pl-24">{children}</main>
              <Show when="signed-in">
                <AppNav />
              </Show>
            </TransactionModalProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
