"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CalendarDay } from "@/lib/types";

type Props = {
  clientId: string;
  accentColor: string;
  month: string; // YYYY-MM
  days: CalendarDay[];
  todayDate: string; // YYYY-MM-DD in user TZ (computed server-side or client-side)
};

function ymOf(month: string): { year: number; m: number } {
  const parts = month.split("-");
  const year = Number(parts[0]);
  const m = Number(parts[1]);
  return { year, m };
}

function addMonths(month: string, delta: number): string {
  const { year, m } = ymOf(month);
  const d = new Date(Date.UTC(year, m - 1 + delta, 1));
  const y = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${mm}`;
}

function monthLabel(month: string): string {
  const { year, m } = ymOf(month);
  const d = new Date(Date.UTC(year, m - 1, 1));
  return d.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function CalendarMonth({
  clientId,
  accentColor,
  month,
  days,
  todayDate,
}: Props) {
  const router = useRouter();
  const { year, m } = ymOf(month);
  const firstWeekdayUTC = new Date(Date.UTC(year, m - 1, 1)).getUTCDay(); // 0=Sun
  const lead = firstWeekdayUTC; // Sunday-first

  function goMonth(delta: number) {
    const next = addMonths(month, delta);
    router.push(`/app/c/${clientId}?month=${next}`);
  }

  function goToday() {
    router.push(`/app/c/${clientId}/${todayDate}`);
  }

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">{monthLabel(month)}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goMonth(-1)}
            className="daybook-btn daybook-btn-ghost px-3 py-1"
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goToday}
            className="daybook-btn daybook-btn-accent px-3 py-1"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => goMonth(1)}
            className="daybook-btn daybook-btn-ghost px-3 py-1"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="daybook-meta text-center py-1">
            {d}
          </div>
        ))}
        {Array.from({ length: lead }).map((_, i) => (
          <div key={`pad-${i}`} aria-hidden="true" />
        ))}
        {days.map((d) => {
          const dayNum = Number(d.date.slice(-2));
          const isToday = d.date === todayDate;
          return (
            <Link
              key={d.date}
              href={`/app/c/${clientId}/${d.date}`}
              className="aspect-square border border-[color:var(--color-divider)] rounded-sm p-2 text-sm flex flex-col justify-between hover:opacity-80 transition-opacity"
              style={
                d.has_entry
                  ? { backgroundColor: accentColor, color: "#fff" }
                  : undefined
              }
              aria-label={`${d.date}${d.has_entry ? " (has entry)" : ""}${
                isToday ? " (today)" : ""
              }`}
            >
              <span className="font-mono text-xs">{dayNum}</span>
              {isToday ? (
                <span className="daybook-meta text-[0.65rem]">today</span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
