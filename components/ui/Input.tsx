import type { InputHTMLAttributes } from "react";

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  const cls = ["daybook-input", className].filter(Boolean).join(" ");
  return <input className={cls} {...rest} />;
}
