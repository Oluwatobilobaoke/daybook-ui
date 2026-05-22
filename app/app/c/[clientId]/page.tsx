import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { buildCookieHeader, requireMe } from "@/lib/session";
import type { CalendarDay, Client } from "@/lib/types";
import { CalendarMonth } from "@/components/CalendarMonth";

type PageProps = {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ month?: string }>;
};

function currentYYYYMM(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function currentYYYYMMDD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Must match BE's MondayInUserTZ — disagreement → BE rejects with 400.
function mondayInTZ(tz: string): string {
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    });
    const parts = fmt.formatToParts(new Date());
    const get = (t: string) =>
      parts.find((p) => p.type === t)?.value ?? "";
    const ymd = `${get("year")}-${get("month")}-${get("day")}`;
    const idx = weekdays.indexOf(get("weekday"));
    if (idx < 0) throw new Error("weekday parse failed");
    const daysSinceMonday = (idx + 6) % 7;
    const d = new Date(ymd + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - daysSinceMonday);
    return d.toISOString().slice(0, 10);
  } catch {
    const d = new Date();
    const idx = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() - ((idx + 6) % 7));
    return d.toISOString().slice(0, 10);
  }
}

export default async function ClientCalendarPage({
  params,
  searchParams,
}: PageProps) {
  const { clientId } = await params;
  const { month: monthParam } = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(monthParam ?? "")
    ? (monthParam as string)
    : currentYYYYMM();
  const me = await requireMe();
  const weekStart = mondayInTZ(me.timezone);
  const cookieHeader = await buildCookieHeader();

  let client: Client | undefined;
  try {
    const all = await apiFetch<Client[]>("/api/clients", { cookieHeader });
    client = all.find((c) => c.id === clientId);
  } catch {
    /* fall through */
  }
  if (!client) notFound();

  let days: CalendarDay[] = [];
  try {
    days = await apiFetch<CalendarDay[]>(
      `/api/clients/${clientId}/calendar?month=${month}`,
      { cookieHeader },
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <main className="p-4 sm:p-6 lg:p-10 max-w-4xl">
      <header className="flex items-center gap-3 mb-6 min-w-0">
        <span
          aria-hidden="true"
          className="w-4 h-4 rounded-sm border border-[color:var(--color-fg)] shrink-0"
          style={{ backgroundColor: client.accent_color }}
        />
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight truncate">
          {client.name}
        </h1>
      </header>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <Link
          href={`/app/c/${client.id}/${currentYYYYMMDD()}`}
          className="daybook-meta hover:underline underline-offset-2"
        >
          Open today →
        </Link>
        <Link
          href={`/app/c/${client.id}/rollups/${weekStart}`}
          className="daybook-meta hover:underline underline-offset-2"
        >
          This week&apos;s rollup →
        </Link>
      </div>

      <CalendarMonth
        clientId={client.id}
        accentColor={client.accent_color}
        month={month}
        days={days}
        todayDate={currentYYYYMMDD()}
      />
    </main>
  );
}
