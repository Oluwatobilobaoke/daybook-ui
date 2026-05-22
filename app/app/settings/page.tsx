import { requireMe } from "@/lib/session";
import { DashedHr } from "@/components/ui/DashedHr";
import { RemindersForm } from "./RemindersForm";

export default async function SettingsPage() {
  const me = await requireMe();

  return (
    <main className="p-4 sm:p-6 lg:p-10 max-w-2xl">
      <div className="daybook-meta">Settings</div>
      <h1 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
        Account
      </h1>

      <DashedHr className="my-6" />

      <section aria-labelledby="profile-h" className="flex flex-col gap-3">
        <h2 id="profile-h" className="text-xl font-semibold tracking-tight">
          Profile
        </h2>
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <dt className="daybook-meta">Email</dt>
          <dd className="col-span-2 break-words">{me.email}</dd>
        </dl>
      </section>

      <DashedHr className="my-8" />

      <section aria-labelledby="reminders-h" className="flex flex-col gap-4">
        <div>
          <h2 id="reminders-h" className="text-xl font-semibold tracking-tight">
            Reminders & timezone
          </h2>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Set your local time once and choose when each reminder fires. All
            three can be toggled off independently.
          </p>
        </div>
        <RemindersForm me={me} />
      </section>

      <DashedHr className="my-8" />

      <section aria-labelledby="polish-h" className="flex flex-col gap-3">
        <h2 id="polish-h" className="text-xl font-semibold tracking-tight">
          Polish
        </h2>
        <p className="text-sm">
          <span className="font-mono">{me.polishes_this_month}</span>{" "}
          polish{me.polishes_this_month === 1 ? "" : "es"} used this month.
        </p>
        <p className="text-sm text-[color:var(--color-muted)]">
          Polish runs only when you click the button on an entry or rollup. No
          automatic rewrites.
        </p>
      </section>
    </main>
  );
}
