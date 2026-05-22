import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { buildCookieHeader } from "@/lib/session";
import type { Client, Entry } from "@/lib/types";
import { EntryEditor } from "@/components/EntryEditor";
import { DateNav } from "./DateNav";
import { CreateBackfillButton } from "./CreateBackfillButton";

type PageProps = {
  params: Promise<{ clientId: string; date: string }>;
};

function currentYYYYMMDD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

export default async function DayEntryPage({ params }: PageProps) {
  const { clientId, date } = await params;
  if (!isValidDate(date)) notFound();
  const today = currentYYYYMMDD();
  const isToday = date === today;
  const cookieHeader = await buildCookieHeader();

  let client: Client | undefined;
  try {
    const all = await apiFetch<Client[]>("/api/clients", { cookieHeader });
    client = all.find((c) => c.id === clientId);
  } catch {
    /* fall through */
  }
  if (!client) notFound();

  let entry: Entry | null = null;
  let entryMissing = false;
  try {
    entry = await apiFetch<Entry>(
      isToday
        ? `/api/clients/${clientId}/entries/today`
        : `/api/clients/${clientId}/entries/${date}`,
      { cookieHeader },
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      entryMissing = true;
    } else {
      throw err;
    }
  }
  return (
    <main className="p-4 sm:p-6 lg:p-10 max-w-4xl">
      <nav className="flex items-center gap-2 text-sm mb-3">
        <Link
          href={`/app/c/${clientId}`}
          className="hover:underline underline-offset-2"
        >
          ← {client.name}
        </Link>
      </nav>

      <header className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 sm:gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <span
            aria-hidden="true"
            className="w-4 h-4 rounded-sm border border-[color:var(--color-fg)] shrink-0"
            style={{ backgroundColor: client.accent_color }}
          />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight min-w-0 break-words">
            {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h1>
          {isToday ? (
            <span
              className="daybook-meta px-2 py-0.5 rounded-sm bg-[color:var(--color-accent-orange)] text-[color:var(--color-bg)]"
            >
              today
            </span>
          ) : null}
        </div>
        <DateNav clientId={clientId} date={date} />
      </header>

      {entryMissing || !entry ? (
        <div className="border border-dashed border-[color:var(--color-divider)] p-8 rounded-sm flex flex-col gap-4">
          <p className="text-base">No entry exists for this day yet.</p>
          <CreateBackfillButton clientId={clientId} date={date} />
        </div>
      ) : (
        <EntryEditor entry={entry} />
      )}
    </main>
  );
}
