import { SignIn } from "@clerk/nextjs";
import { Logo } from "~/components/logo";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="flex flex-col items-center gap-3">
        <Logo size={56} />
        <h1 className="font-display text-2xl font-bold text-navy">Welcome back</h1>
      </div>
      <SignIn
        fallbackRedirectUrl="/accounts"
        appearance={{
          elements: {
            rootBox: "w-full max-w-sm",
            card: "shadow-none border border-border w-full",
          },
        }}
      />
    </div>
  );
}
