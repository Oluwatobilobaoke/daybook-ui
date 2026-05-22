"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { PolishDiffModal } from "@/components/PolishDiffModal";
import { patchRollupAction, polishAction } from "@/app/actions";
import type { Rollup } from "@/lib/types";

type Props = {
  rollup: Rollup;
};

function nowHHMMSS(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Save is button-only (no autosave) — rollups are higher-stakes than entries.
// Preview is a plain <pre>; swap for rendered output when a markdown lib lands.
export function RollupEditor({ rollup }: Props) {
  const initial = rollup.edited_md ?? rollup.generated_md;
  const [text, setText] = useState(initial);
  const [savedText, setSavedText] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"source" | "preview">("source");

  const [polishing, setPolishing] = useState(false);
  const [polishError, setPolishError] = useState<string | null>(null);
  const [polishRateLimited, setPolishRateLimited] = useState(false);
  const [polishResult, setPolishResult] = useState<{
    polished: string;
    model: string;
  } | null>(null);

  const dirty = text !== savedText;

  function onSave() {
    if (!dirty || pending) return;
    setError(null);
    startTransition(async () => {
      const res = await patchRollupAction({
        rollupId: rollup.id,
        editedMd: text === rollup.generated_md ? null : text,
      });
      if (res.ok) {
        setSavedText(text);
        setLastSaved(nowHHMMSS());
      } else {
        setError(res.message);
      }
    });
  }

  async function onPolishClick() {
    if (polishing) return;
    if (!text || text.trim() === "") {
      setPolishError("Nothing to polish yet.");
      return;
    }
    setPolishing(true);
    setPolishError(null);
    setPolishRateLimited(false);
    const res = await polishAction({ text, kind: "rollup" });
    setPolishing(false);
    if (res.ok) {
      setPolishResult({ polished: res.polished, model: res.model });
    } else if (res.rateLimited) {
      setPolishRateLimited(true);
    } else {
      setPolishError(res.message);
    }
  }

  function onAcceptPolish(finalText: string) {
    setPolishResult(null);
    setText(finalText);
  }

  function onReset() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const res = await patchRollupAction({
        rollupId: rollup.id,
        editedMd: null,
      });
      if (res.ok) {
        setText(rollup.generated_md);
        setSavedText(rollup.generated_md);
        setLastSaved(nowHHMMSS());
      } else {
        setError(res.message);
      }
    });
  }

  const statusLabel = pending
    ? "Saving…"
    : dirty
      ? "Unsaved changes"
      : lastSaved
        ? `Saved at ${lastSaved}`
        : rollup.edited_md
          ? "Edited"
          : "Generated";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="md:hidden flex items-center gap-1" role="tablist" aria-label="View">
            <TabBtn active={tab === "source"} onClick={() => setTab("source")}>
              Source
            </TabBtn>
            <TabBtn active={tab === "preview"} onClick={() => setTab("preview")}>
              Preview
            </TabBtn>
          </div>
          <span className="daybook-meta" aria-live="polite">
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {rollup.edited_md ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onReset}
              disabled={pending}
              className="!py-1 !px-3 text-sm"
              aria-label="Discard edits and revert to generated draft"
            >
              Reset to generated
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            onClick={onPolishClick}
            disabled={polishing || pending || !text.trim()}
            aria-label="Polish the rollup with AI"
            className="!py-1 !px-3 text-sm"
          >
            {polishing ? "Polishing…" : "Polish with AI"}
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={!dirty || pending}
            className="!py-1 !px-3 text-sm"
          >
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-[color:var(--color-accent-orange)]">
          {error}
        </p>
      ) : null}
      {polishError ? (
        <p className="text-sm text-[color:var(--color-accent-orange)]">
          {polishError}
        </p>
      ) : null}
      {polishRateLimited ? (
        <p className="text-sm text-[color:var(--color-muted)]">
          Rate limit reached — try again in a minute.
        </p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section
          aria-label="Source"
          className={tab === "source" ? "block" : "hidden md:block"}
        >
          <div className="daybook-meta mb-2">Source</div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[20rem] font-mono text-sm leading-relaxed"
            aria-label="Rollup source markdown"
            spellCheck
          />
        </section>
        <section
          aria-label="Preview"
          className={tab === "preview" ? "block" : "hidden md:block"}
        >
          <div className="daybook-meta mb-2">Preview</div>
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed border border-[color:var(--color-divider)] rounded-sm p-3 min-h-[20rem]">
            {text || "(empty)"}
          </pre>
        </section>
      </div>

      <PolishDiffModal
        open={polishResult !== null}
        original={text}
        polished={polishResult?.polished ?? ""}
        model={polishResult?.model ?? ""}
        onAccept={onAcceptPolish}
        onClose={() => setPolishResult(null)}
      />
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`px-2 py-1 rounded-sm text-xs font-mono uppercase tracking-wide ${
        active
          ? "bg-[color:var(--color-fg)] text-[color:var(--color-bg)]"
          : "border border-[color:var(--color-divider)] text-[color:var(--color-muted)]"
      }`}
    >
      {children}
    </button>
  );
}
