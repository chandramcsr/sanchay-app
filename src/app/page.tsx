import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/accounts");

  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <h1 className="font-display text-3xl font-bold text-navy">Sanchay</h1>
      <p className="text-muted">Sign in to see your accounts.</p>
    </div>
  );
}
