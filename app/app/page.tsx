import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { buildCookieHeader } from "@/lib/session";
import type { TodayItem } from "@/lib/types";
import { EntryEditor } from "@/components/EntryEditor";
import { DashedHr } from "@/components/ui/DashedHr";

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function TodayAcrossClientsPage() {
  const cookieHeader = await buildCookieHeader();
  const items = await apiFetch<TodayItem[]>("/api/today", { cookieHeader });

  return (
    <main className="p-4 sm:p-6 lg:p-10 max-w-4xl">
      <header className="flex items-baseline justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="daybook-meta">Today</div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight break-words">
            {todayLabel()}
          </h1>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="border border-dashed border-[color:var(--color-divider)] p-8 rounded-sm">
          <p className="text-base">
            You don’t have any active clients yet.
          </p>
          <p className="mt-2 text-sm text-[color:var(--color-muted)]">
            Use the sidebar to add your first client to start logging.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-8">
          {items.map((it) => (
            <li key={it.client.id}>
              <article className="flex flex-col gap-4">
                <header className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      aria-hidden="true"
                      className="w-4 h-4 rounded-sm border border-[color:var(--color-fg)] shrink-0"
                      style={{ backgroundColor: it.client.accent_color }}
                    />
                    <Link
                      href={`/app/c/${it.client.id}`}
                      className="text-lg sm:text-xl font-semibold hover:underline underline-offset-2 truncate"
                    >
                      {it.client.name}
                    </Link>
                  </div>
                  <Link
                    href={`/app/c/${it.client.id}/${it.entry.entry_date}`}
                    className="daybook-meta hover:underline underline-offset-2 shrink-0"
                  >
                    Open day →
                  </Link>
                </header>
                <EntryEditor entry={it.entry} compact />
              </article>
              <DashedHr className="mt-8" />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
