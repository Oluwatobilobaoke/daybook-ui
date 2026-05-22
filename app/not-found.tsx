import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-10">
      <div className="max-w-md">
        <div className="daybook-meta">404</div>
        <h1 className="mt-2 daybook-display text-5xl">Not found.</h1>
        <p className="mt-4 text-base">
          We couldn’t find that page.{" "}
          <Link
            href="/"
            className="underline underline-offset-2 hover:text-[color:var(--color-accent-orange)]"
          >
            Go home
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
