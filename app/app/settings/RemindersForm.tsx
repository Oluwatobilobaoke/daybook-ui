"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { patchMeAction } from "@/app/actions";
import type { Me } from "@/lib/types";

type Props = {
  me: Me;
};

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => h);

function formatHour(h: number): string {
  if (h === 0) return "12:00 AM";
  if (h === 12) return "12:00 PM";
  if (h < 12) return `${h}:00 AM`;
  return `${h - 12}:00 PM`;
}

export function RemindersForm({ me }: Props) {
  const [timezone, setTimezone] = useState(me.timezone);
  const [morningOn, setMorningOn] = useState(me.morning_reminder_hour !== null);
  const [morningHour, setMorningHour] = useState(me.morning_reminder_hour ?? 8);
  const [eveningOn, setEveningOn] = useState(me.evening_reminder_hour !== null);
  const [eveningHour, setEveningHour] = useState(me.evening_reminder_hour ?? 18);
  const [weeklyOn, setWeeklyOn] = useState(me.weekly_reminder_hour !== null);
  const [weeklyHour, setWeeklyHour] = useState(me.weekly_reminder_hour ?? 17);

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function onSubmit(formData: FormData) {
    void formData;
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await patchMeAction({
        timezone: timezone.trim(),
        morningHour: morningOn ? morningHour : null,
        eveningHour: eveningOn ? eveningHour : null,
        weeklyHour: weeklyOn ? weeklyHour : null,
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="timezone" className="daybook-meta">
          Timezone
        </label>
        <Input
          id="timezone"
          name="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          placeholder="e.g. Europe/London, America/Los_Angeles, UTC"
          required
        />
        <p className="text-xs text-[color:var(--color-muted)]">
          IANA zone. Affects reminder send times and the rollup week boundary.
        </p>
      </div>

      <fieldset className="flex flex-col gap-3 border border-dashed border-[color:var(--color-divider)] rounded-sm p-3 sm:p-4">
        <legend className="daybook-meta px-1">Reminders</legend>

        <ReminderRow
          label="Morning"
          hint="lists yesterday's incomplete plans"
          enabled={morningOn}
          onToggle={setMorningOn}
          hour={morningHour}
          onHourChange={setMorningHour}
        />
        <ReminderRow
          label="Evening"
          hint="asks how today went"
          enabled={eveningOn}
          onToggle={setEveningOn}
          hour={eveningHour}
          onHourChange={setEveningHour}
        />
        <ReminderRow
          label="Friday weekly"
          hint="links to each client's rollup"
          enabled={weeklyOn}
          onToggle={setWeeklyOn}
          hour={weeklyHour}
          onHourChange={setWeeklyHour}
        />
      </fieldset>

      <div className="flex items-center gap-3 flex-wrap">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
        {saved ? (
          <span className="daybook-meta" aria-live="polite">
            Saved
          </span>
        ) : null}
        {error ? (
          <p className="text-sm text-[color:var(--color-accent-orange)]">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}

type ReminderRowProps = {
  label: string;
  hint: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  hour: number;
  onHourChange: (h: number) => void;
};

function ReminderRow({
  label,
  hint,
  enabled,
  onToggle,
  hour,
  onHourChange,
}: ReminderRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <label className="flex items-center gap-2 sm:flex-1 min-w-0">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-4 h-4 accent-[color:var(--color-fg)] shrink-0"
        />
        <span className="text-sm">
          <span className="font-medium">{label}</span>
          <span className="ml-2 text-xs text-[color:var(--color-muted)]">
            {hint}
          </span>
        </span>
      </label>
      <select
        value={hour}
        onChange={(e) => onHourChange(Number(e.target.value))}
        disabled={!enabled}
        aria-label={`${label} reminder hour`}
        className="daybook-input !py-1 !px-2 text-sm !w-auto self-start sm:self-auto disabled:opacity-40"
      >
        {HOUR_OPTIONS.map((h) => (
          <option key={h} value={h}>
            {formatHour(h)}
          </option>
        ))}
      </select>
    </div>
  );
}
