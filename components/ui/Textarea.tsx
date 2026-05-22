import type { TextareaHTMLAttributes, Ref } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  ref?: Ref<HTMLTextAreaElement>;
};

export function Textarea({ className, ref, ...rest }: Props) {
  const cls = [
    "daybook-input",
    "min-h-[10rem]",
    "resize-y",
    "leading-relaxed",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <textarea ref={ref} className={cls} {...rest} />;
}
