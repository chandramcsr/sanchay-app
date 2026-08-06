import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
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
          data that was never real.

          No second "Sign in" button here -- the header's is already
          visible in the same viewport on a page this short, so a
          second identical action right below it was pure redundancy,
          not a real second entry point (that pattern earns its place
          on a long page where the header CTA stays reachable after
          scrolling past the hero; this page has no scroll to speak
          of). */}
      <div
        aria-hidden="true"
        className="w-full max-w-sm rounded-2xl bg-navy px-6 py-8 text-white opacity-90"
      >
        <div className="text-sm text-white/50">Net Worth · All Accounts</div>
        <div className="font-mono text-4xl font-medium tracking-widest text-white/30">••••••</div>
      </div>
    </div>
  );
}
