"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="min-h-screen flex items-center justify-center p-10">
      <div className="max-w-xl">
        <div className="daybook-meta">Something went wrong</div>
        <h1 className="mt-2 text-3xl lg:text-4xl font-semibold tracking-tight">
          We hit an unexpected error.
        </h1>
        <p className="mt-4 text-base leading-relaxed">
          {error.message || "Please try again."}
        </p>
        <Button type="button" onClick={reset} className="mt-6">
          Retry
        </Button>
      </div>
    </main>
  );
}
