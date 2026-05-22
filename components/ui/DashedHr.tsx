export function DashedHr({ className }: { className?: string }) {
  const cls = ["daybook-dashed-hr", "my-6", className]
    .filter(Boolean)
    .join(" ");
  return <hr className={cls} />;
}
