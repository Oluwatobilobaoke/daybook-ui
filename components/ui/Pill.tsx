import type { HTMLAttributes } from "react";

type Tone = "cyan" | "yellow" | "gray" | "orange";

type Props = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
};

const toneClass: Record<Tone, string> = {
  cyan: "bg-[color:var(--color-accent-cyan)] text-[color:var(--color-fg)]",
  yellow:
    "bg-[color:var(--color-fg)] text-[color:var(--color-accent-yellow)]",
  gray: "bg-[color:var(--color-accent-gray)] text-[color:var(--color-fg)]",
  orange:
    "bg-[color:var(--color-accent-orange)] text-[color:var(--color-bg)]",
};

export function Pill({ tone = "gray", className, ...rest }: Props) {
  const cls = [
    "inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-mono uppercase tracking-wide",
    toneClass[tone],
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <span className={cls} {...rest} />;
}
