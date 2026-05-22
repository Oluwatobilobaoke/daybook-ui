"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { createEntryForDateAction } from "@/app/actions";

type Props = {
  clientId: string;
  date: string;
};

export function CreateBackfillButton({ clientId, date }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2 items-start">
      <Button
        type="button"
        variant="accent"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const res = await createEntryForDateAction({ clientId, date });
            if (res.ok) {
              router.refresh();
            } else {
              setError(res.message);
            }
          });
        }}
      >
        {pending ? "Creating…" : "Start entry on this date"}
      </Button>
      {error ? (
        <p className="text-sm text-[color:var(--color-accent-orange)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
