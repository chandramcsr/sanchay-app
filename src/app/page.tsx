import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import { Logo } from "~/components/logo";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/accounts");

  return (
    <div className="flex flex-col items-center gap-10 py-20 text-center">
      <div className="flex flex-col items-center gap-3">
        <Logo size={56} />
        <h1 className="font-display text-4xl font-bold tracking-tight text-navy">Sanchay</h1>
        <p className="max-w-xs text-muted">Sign in to see your accounts, transactions, and budgets.</p>
      </div>

      {/* Signature element: a preview of the same net-worth card signed-in
          users see on /accounts, with the real number replaced by masked
          dots -- teases the actual product's own visual identity rather
          than a generic marketing hero, and reads honestly as "your real
          numbers are on the other side of signing in," not a mockup of
          data that was never real. */}
      <div
        aria-hidden="true"
        className="w-full max-w-sm rounded-2xl bg-navy px-6 py-8 text-white opacity-90"
      >
        <div className="text-sm text-white/50">Net Worth · All Accounts</div>
        <div className="font-mono text-4xl font-medium tracking-widest text-white/30">••••••</div>
      </div>

      {/* A second "Sign in" here, right below the hero card, alongside
          the header's -- a deliberate design choice (kept on request),
          not an oversight this time. */}
      <SignInButton>
        <button className="rounded-lg bg-gold px-6 py-3 text-sm font-medium text-navy transition hover:opacity-90">
          Sign in
        </button>
      </SignInButton>
    </div>
  );
}
