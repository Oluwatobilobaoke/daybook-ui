"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { regenerateRollupAction } from "@/app/actions";

type Props = {
  clientId: string;
  weekStart: string;
  hasContent: boolean;
  /** When true, regenerate would discard saved edits — confirm first. */
  hasEdits: boolean;
};

export function RegenerateButton({
  clientId,
  weekStart,
  hasContent,
  hasEdits,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    startTransition(async () => {
      const res = await regenerateRollupAction({ clientId, weekStart });
      if (!res.ok) setError(res.message);
    });
  }

  function onClick() {
    if (hasEdits) {
      const ok = window.confirm(
        "Regenerating will discard your saved edits to this rollup. Continue?",
      );
      if (!ok) return;
    }
    run();
  }

  const label = pending
    ? hasContent
      ? "Regenerating…"
      : "Generating…"
    : hasContent
      ? "Regenerate"
      : "Generate";

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" onClick={onClick} disabled={pending}>
        {label}
      </Button>
      {error ? (
        <p className="text-xs text-[color:var(--color-accent-orange)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
