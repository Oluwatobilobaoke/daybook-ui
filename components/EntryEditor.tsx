"use client";

import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { PlanList } from "@/components/PlanList";
import { PolishDiffModal } from "@/components/PolishDiffModal";
import { patchEntryAction, polishAction } from "@/app/actions";
import type { Entry } from "@/lib/types";

const AUTOSAVE_MS = 3000;

type Props = {
  entry: Entry;
  compact?: boolean;
};

function nowHHMMSS(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function EntryEditor({ entry, compact }: Props) {
  const [text, setText] = useState(entry.what_happened_md);
  const [savedText, setSavedText] = useState(entry.what_happened_md);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [polishing, setPolishing] = useState(false);
  const [polishError, setPolishError] = useState<string | null>(null);
  const [polishRateLimited, setPolishRateLimited] = useState(false);
  const [polishResult, setPolishResult] = useState<{
    polished: string;
    model: string;
  } | null>(null);

  const textRef = useRef<HTMLTextAreaElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = async (value: string) => {
    if (value === savedText) return;
    setSaving(true);
    const res = await patchEntryAction({
      entryId: entry.id,
      whatHappenedMd: value,
    });
    setSaving(false);
    if (res.ok) {
      setSavedText(value);
      setLastSaved(nowHHMMSS());
      setError(null);
    } else {
      setError(res.message);
    }
  };

  useEffect(() => {
    if (text === savedText) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void save(text);
    }, AUTOSAVE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const dirty = text !== savedText;

  async function onPolishClick() {
    if (polishing) return;
    if (!text || text.trim() === "") {
      setPolishError("Nothing to polish yet.");
      return;
    }
    setPolishing(true);
    setPolishError(null);
    setPolishRateLimited(false);
    const res = await polishAction({ text, kind: "entry" });
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
    if (timerRef.current) clearTimeout(timerRef.current);
    void save(finalText);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <label htmlFor={`entry-${entry.id}-md`} className="daybook-meta">
          What happened
        </label>
        <div className="flex items-center gap-3">
          <span className="daybook-meta" aria-live="polite">
            {saving
              ? "Saving…"
              : dirty
              ? "Unsaved changes"
              : lastSaved
              ? `Saved at ${lastSaved}`
              : "Saved"}
          </span>
          <Button
            type="button"
            variant="ghost"
            onClick={onPolishClick}
            disabled={polishing || !text.trim()}
            aria-label="Polish what happened"
            className="!py-1 !px-3 text-sm"
          >
            {polishing ? "Polishing…" : "Polish"}
          </Button>
        </div>
      </div>

      <Textarea
        id={`entry-${entry.id}-md`}
        ref={textRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => void save(text)}
        placeholder="Plain markdown. Live preview is deferred to a later phase."
        className={compact ? "min-h-[8rem]" : "min-h-[12rem]"}
      />
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
      <hr className="daybook-dashed-hr" />
      <PlanList entryId={entry.id} initialPlans={entry.plans} />

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
