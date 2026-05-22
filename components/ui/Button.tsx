import type { ButtonHTMLAttributes, Ref } from "react";

type Variant = "solid" | "accent" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  ref?: Ref<HTMLButtonElement>;
};

const variantClass: Record<Variant, string> = {
  solid: "daybook-btn",
  accent: "daybook-btn daybook-btn-accent",
  ghost: "daybook-btn daybook-btn-ghost",
};

export function Button({
  variant = "solid",
  className,
  ref,
  ...rest
}: ButtonProps) {
  const cls = [variantClass[variant], className].filter(Boolean).join(" ");
  return <button ref={ref} className={cls} {...rest} />;
}
