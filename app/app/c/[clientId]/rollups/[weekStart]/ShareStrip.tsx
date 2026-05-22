"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { shareRollupAction, revokeRollupAction } from "@/app/actions";
import type { Rollup } from "@/lib/types";

type Props = {
  rollup: Rollup;
  clientId: string;
  weekStart: string;
};

function formatSharedAt(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ShareStrip({ rollup, clientId, weekStart }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isShared = !!(
    rollup.share_token &&
    !rollup.revoked_at
  );
  const isRevoked = !!(rollup.share_token && rollup.revoked_at);

  function onShare() {
    setError(null);
    startTransition(async () => {
      const res = await shareRollupAction({
        rollupId: rollup.id,
        clientId,
        weekStart,
      });
      if (!res.ok) setError(res.message);
    });
  }

  function onRevoke() {
    if (pending) return;
    const ok = window.confirm(
      "Revoking the share link will 404 it for anyone with the URL. Continue?",
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const res = await revokeRollupAction({
        rollupId: rollup.id,
        clientId,
        weekStart,
      });
      if (!res.ok) setError(res.message);
    });
  }

  function onCopy() {
    if (!rollup.share_token) return;
    const url = `${window.location.origin}/r/${rollup.share_token}`;
    void navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        setError("Could not copy. Select the URL manually.");
      });
  }

  return (
    <section
      aria-label="Sharing"
      className="border border-dashed border-[color:var(--color-divider)] rounded-sm p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
    >
      {isShared ? (
        <>
          <div className="min-w-0 flex-1 flex flex-col gap-1">
            <div className="daybook-meta">
              Shared on {formatSharedAt(rollup.shared_at) || "—"}
            </div>
            <a
              href={`/r/${rollup.share_token}`}
              className="text-sm font-mono break-all hover:underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              /r/{rollup.share_token}
            </a>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="ghost"
              onClick={onCopy}
              disabled={pending}
              className="!py-1 !px-3 text-sm"
              aria-live="polite"
            >
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={onRevoke}
              disabled={pending}
              className="!py-1 !px-3 text-sm"
            >
              {pending ? "Revoking…" : "Revoke"}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="min-w-0 flex-1 flex flex-col gap-1">
            <div className="daybook-meta">Sharing</div>
            <p className="text-sm text-[color:var(--color-muted)]">
              {isRevoked
                ? "The previous link was revoked. Sharing again mints a new URL."
                : "Send your manager a clean read-only link."}
            </p>
          </div>
          <div>
            <Button
              type="button"
              onClick={onShare}
              disabled={pending}
              className="!py-1 !px-3 text-sm"
            >
              {pending
                ? "Sharing…"
                : isRevoked
                  ? "Share again"
                  : "Share this rollup"}
            </Button>
          </div>
        </>
      )}
      {error ? (
        <p className="basis-full text-sm text-[color:var(--color-accent-orange)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
