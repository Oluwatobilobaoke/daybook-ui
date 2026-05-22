import type { HTMLAttributes } from "react";

export function Card({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  const cls = [
    "border border-[color:var(--color-fg)] rounded-sm bg-[color:var(--color-bg)] p-5",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <div className={cls} {...rest} />;
}
