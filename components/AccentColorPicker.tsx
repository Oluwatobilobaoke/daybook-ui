"use client";

import { useState } from "react";

const PALETTE = [
  "#007ca6",
  "#77c6d4",
  "#dd9f61",
  "#bac7cb",
  "#2b2b2b",
  "#7a4cff",
  "#e0497a",
  "#3aa17e",
];

type Props = {
  name: string;
  initial?: string;
};

export function AccentColorPicker({ name, initial }: Props) {
  const [value, setValue] = useState(initial ?? PALETTE[0]!);
  return (
    <div className="flex items-center gap-3">
      <input type="hidden" name={name} value={value} />
      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="Accent color"
      >
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            aria-checked={c === value}
            aria-label={`Color ${c}`}
            role="radio"
            onClick={() => setValue(c)}
            className="w-8 h-8 rounded-sm border border-[color:var(--color-fg)] transition-opacity hover:opacity-80"
            style={{
              backgroundColor: c,
              outline: c === value ? "2px solid var(--color-fg)" : "none",
              outlineOffset: "2px",
            }}
          />
        ))}
      </div>
      <span className="daybook-meta">{value}</span>
    </div>
  );
}
