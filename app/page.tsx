import Link from "next/link";
import { StackDivider } from "@/components/ui/StackDivider";
import { DashedHr } from "@/components/ui/DashedHr";

const PROCESS_STEPS = [
  {
    n: "01",
    title: "Open today.",
    body: "Pick a client. Today’s entry is already waiting. Yesterday’s unchecked plans carry over.",
  },
  {
    n: "02",
    title: "Write what happened.",
    body: "Plain markdown. No app to fight. Autosaves while you work — last save is always on screen.",
  },
  {
    n: "03",
    title: "Ship Friday.",
    body: "On Friday the app drafts a weekly rollup per client. Tighten the prose, share the link.",
  },
];

export default function MarketingPage() {
  return (
    <main className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-5 border-b border-dashed border-[color:var(--color-divider)]">
        <Link href="/" className="font-semibold tracking-tight">
          Daybook
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/login"
            className="hover:text-[color:var(--color-accent-orange)] transition-colors"
          >
            Sign in
          </Link>
        </div>
      </nav>

      <section className="px-6 lg:px-16 pt-16 lg:pt-32 pb-24">
        <div className="max-w-[1280px]">
          <h1 className="daybook-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[12rem]">
            A daybook
            <br />
            for the work
            <br />
            you forgot
            <br />
            you did.
          </h1>
          <p className="mt-10 max-w-xl text-lg leading-relaxed">
            A daily journal for solo consultants. Log what happened, who it was
            for, and what’s next — then turn the week into a clean rollup your
            client can read.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <Link
              href="/login"
              className="daybook-btn daybook-btn-accent text-lg"
            >
              Sign in
            </Link>
            <span className="daybook-meta">No password. Magic link only.</span>
          </div>
        </div>
      </section>

      <StackDivider />

      <section className="px-6 lg:px-16 py-16 lg:py-24">
        <div className="max-w-[1280px] grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-20">
          <header className="lg:col-span-1 lg:sticky lg:top-10 self-start">
            <div className="daybook-meta">How it works</div>
            <h2 className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight">
              Three moves.
            </h2>
          </header>
          <ol className="lg:col-span-4 flex flex-col">
            {PROCESS_STEPS.map((step, i) => (
              <li
                key={step.n}
                className="grid grid-cols-12 gap-6 py-10 first:pt-0"
              >
                <div className="col-span-3 lg:col-span-2 daybook-display text-5xl lg:text-7xl text-[color:var(--color-accent-orange)] sticky top-10 self-start">
                  {step.n}
                </div>
                <div className="col-span-9 lg:col-span-10">
                  <h3 className="text-2xl lg:text-3xl font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-base lg:text-lg leading-relaxed max-w-2xl">
                    {step.body}
                  </p>
                  {i < PROCESS_STEPS.length - 1 ? (
                    <DashedHr className="mt-10" />
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <StackDivider />

      <section className="px-6 lg:px-16 py-24 lg:py-32">
        <div className="max-w-[1280px]">
          <h2 className="daybook-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
            Start logging.
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed">
            One inbox link, one minute, and today’s work stops disappearing.
          </p>
          <Link
            href="/login"
            className="mt-10 inline-flex daybook-btn daybook-btn-accent text-lg"
          >
            Get started
          </Link>
        </div>
      </section>

      <footer className="px-6 lg:px-16 py-10 border-t border-dashed border-[color:var(--color-divider)] flex items-center justify-between">
        <span className="daybook-meta">Daybook — Phase 1 alpha</span>
        <span className="daybook-meta">Built for solo consultants</span>
      </footer>
    </main>
  );
}
