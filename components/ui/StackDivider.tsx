export function StackDivider({ className }: { className?: string }) {
  const cls = ["daybook-stack", "my-12", className].filter(Boolean).join(" ");
  return (
    <div className={cls} role="presentation" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}
