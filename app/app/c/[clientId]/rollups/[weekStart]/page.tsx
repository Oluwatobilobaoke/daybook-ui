import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { buildCookieHeader } from "@/lib/session";
import type { Client, Rollup } from "@/lib/types";
import { DashedHr } from "@/components/ui/DashedHr";
import { RegenerateButton } from "./RegenerateButton";
import { RollupEditor } from "./RollupEditor";
import { ShareStrip } from "./ShareStrip";

type PageProps = {
  params: Promise<{ clientId: string; weekStart: string }>;
};

function isYMD(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

function isMondayUTC(ymd: string): boolean {
  const d = new Date(ymd + "T00:00:00Z");
  return d.getUTCDay() === 1;
}

function weekLabel(ymd: string): string {
  const start = new Date(ymd + "T00:00:00Z");
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 4);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  return `${fmt(start)} – ${fmt(end)}, ${start.getUTCFullYear()}`;
}

export default async function RollupPage({ params }: PageProps) {
  const { clientId, weekStart } = await params;
  if (!isYMD(weekStart) || !isMondayUTC(weekStart)) notFound();

  const cookieHeader = await buildCookieHeader();

  let client: Client | undefined;
  try {
    const all = await apiFetch<Client[]>("/api/clients", { cookieHeader });
    client = all.find((c) => c.id === clientId);
  } catch {
    /* fall through */
  }
  if (!client) notFound();

  let rollup: Rollup | null = null;
  try {
    rollup = await apiFetch<Rollup>(
      `/api/clients/${clientId}/rollups/${weekStart}`,
      { cookieHeader },
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      rollup = null;
    } else {
      throw err;
    }
  }

  const hasEdits = !!(rollup?.edited_md && rollup.edited_md.length > 0);

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
          <div className="min-w-0">
            <div className="daybook-meta">Weekly rollup</div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight break-words">
              {weekLabel(weekStart)}
            </h1>
          </div>
        </div>
        <RegenerateButton
          clientId={clientId}
          weekStart={weekStart}
          hasContent={rollup !== null}
          hasEdits={hasEdits}
        />
      </header>

      <DashedHr className="mb-6" />

      {!rollup ? (
        <div className="border border-dashed border-[color:var(--color-divider)] p-8 rounded-sm flex flex-col gap-4">
          <p className="text-base">No rollup yet for this week.</p>
          <p className="text-sm text-[color:var(--color-muted)]">
            Click <span className="font-medium">Generate</span> above to assemble
            this week&apos;s entries into a draft.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <ShareStrip
            rollup={rollup}
            clientId={clientId}
            weekStart={weekStart}
          />
          <RollupEditor rollup={rollup} />
        </div>
      )}
    </main>
  );
}
