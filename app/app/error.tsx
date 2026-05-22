"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function AppError({
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
    <main className="p-10">
      <div className="daybook-meta">Error</div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {error.message || "Something went wrong."}
      </h1>
      <Button type="button" onClick={reset} className="mt-6">
        Retry
      </Button>
    </main>
  );
}
