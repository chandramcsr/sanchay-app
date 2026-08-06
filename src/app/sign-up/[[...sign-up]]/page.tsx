import { SignUp } from "@clerk/nextjs";
import { Logo } from "~/components/logo";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="flex flex-col items-center gap-3">
        <Logo size={56} />
        <h1 className="font-display text-2xl font-bold text-navy">Create your account</h1>
      </div>
      <SignUp
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
