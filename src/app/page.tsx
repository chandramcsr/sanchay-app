import { Show } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <Show when="signed-out">
        <p className="text-lg">Sign in to see your accounts.</p>
      </Show>
      <Show when="signed-in">
        <p className="text-lg">
          Signed in. Accounts/transactions/budgets views land here once
          sanchay-api&apos;s server-authoritative branch has real endpoints
          to call.
        </p>
      </Show>
    </main>
  );
}
