"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  open: boolean;
  original: string;
  polished: string;
  model: string;
  onAccept: (finalText: string) => void;
  onClose: () => void;
};

export function PolishDiffModal({
  open,
  original,
  polished,
  model,
  onAccept,
  onClose,
}: Props) {
  const [edited, setEdited] = useState(polished);
  const [prevPolished, setPrevPolished] = useState(polished);
  const acceptBtnRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<Element | null>(null);

  if (polished !== prevPolished) {
    setPrevPolished(polished);
    setEdited(polished);
  }

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    const t = setTimeout(() => acceptBtnRef.current?.focus(), 0);

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>(
        'button, [href], textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      const prev = previouslyFocused.current;
      if (prev instanceof HTMLElement) prev.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const editsChanged = edited !== polished;

  return (
    <div
      aria-hidden={!open}
      className="fixed inset-0 z-50 flex items-stretch md:items-center justify-center bg-[rgba(43,43,43,0.55)] p-0 md:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="polish-diff-title"
        className="bg-[color:var(--color-bg)] border border-[color:var(--color-fg)] rounded-sm w-full md:max-w-5xl max-h-full md:max-h-[90vh] flex flex-col"
      >
        <header className="flex items-baseline justify-between gap-4 px-6 py-4 border-b border-[color:var(--color-divider)]">
          <div>
            <div className="daybook-meta">Polish</div>
            <h2
              id="polish-diff-title"
              className="text-xl font-semibold tracking-tight"
            >
              Review LLM output
            </h2>
          </div>
          <span className="daybook-meta">{model}</span>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1 min-h-0 overflow-auto">
          <section
            aria-label="Original"
            className="flex flex-col gap-2 p-5 md:border-r border-[color:var(--color-divider)] min-h-0"
          >
            <div className="daybook-meta">Original</div>
            <pre className="flex-1 whitespace-pre-wrap font-mono text-sm leading-relaxed bg-transparent border border-dashed border-[color:var(--color-divider)] rounded-sm p-3 overflow-auto min-h-[12rem]">
              {original || "(empty)"}
            </pre>
          </section>
          <section
            aria-label="Polished"
            className="flex flex-col gap-2 p-5 min-h-0 border-t md:border-t-0 border-[color:var(--color-divider)]"
          >
            <div className="daybook-meta flex items-center justify-between">
              <span>Polished {editsChanged ? "(edited)" : ""}</span>
            </div>
            <textarea
              value={edited}
              onChange={(e) => setEdited(e.target.value)}
              spellCheck={true}
              className="daybook-input flex-1 min-h-[12rem] font-mono text-sm leading-relaxed"
              aria-label="Polished text (editable)"
            />
          </section>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 px-6 py-4 border-t border-[color:var(--color-divider)]">
          <Button type="button" variant="ghost" onClick={onClose}>
            Reject
          </Button>
          {editsChanged ? (
            <Button
              ref={acceptBtnRef}
              type="button"
              onClick={() => onAccept(edited)}
            >
              Save edits
            </Button>
          ) : (
            <Button
              ref={acceptBtnRef}
              type="button"
              onClick={() => onAccept(polished)}
            >
              Accept
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}
