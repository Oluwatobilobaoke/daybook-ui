import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { DashedHr } from "@/components/ui/DashedHr";

export const metadata = {
  title: "Sign in — Daybook",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-5 border-b border-dashed border-[color:var(--color-divider)]">
        <Link href="/" className="font-semibold tracking-tight">
          Daybook
        </Link>
        <Link
          href="/"
          className="text-sm hover:text-[color:var(--color-accent-orange)] transition-colors"
        >
          ← Back
        </Link>
      </nav>
      <section className="flex-1 px-6 py-16 lg:py-24">
        <div className="max-w-md mx-auto">
          <div className="daybook-meta">Sign in</div>
          <h1 className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight">
            Check your inbox.
          </h1>
          <p className="mt-4 text-base leading-relaxed">
            Enter your email and we’ll send you a one-time sign-in link.
            Sessions last 30 days. No passwords.
          </p>
          <DashedHr className="my-8" />
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
