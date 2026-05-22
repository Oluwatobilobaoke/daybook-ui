import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";

type PageProps = {
  params: Promise<{ token: string }>;
};

type PublicRollup = {
  client_name: string;
  client_accent_color: string;
  week_start: string;
  body_md: string;
  shared_at: string;
};

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

function sharedAtLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Brutalist; no app chrome, no auth. Revoked/unknown tokens → 404.
export default async function PublicRollupPage({ params }: PageProps) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]+$/.test(token)) notFound();

  let rollup: PublicRollup;
  try {
    rollup = await apiFetch<PublicRollup>(`/api/r/${token}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <main className="min-h-screen">
      <header
        className="px-5 sm:px-10 lg:px-16 py-8 sm:py-12 border-b border-dashed border-[color:var(--color-divider)]"
        style={{ borderTopColor: rollup.client_accent_color, borderTopWidth: 6, borderTopStyle: "solid" }}
      >
        <div className="max-w-3xl">
          <div className="daybook-meta">Weekly rollup</div>
          <h1 className="mt-2 daybook-display text-4xl sm:text-6xl lg:text-7xl break-words">
            {rollup.client_name}
          </h1>
          <p className="mt-4 text-base sm:text-lg leading-relaxed">
            {weekLabel(rollup.week_start)}
          </p>
        </div>
      </header>

      <article className="px-5 sm:px-10 lg:px-16 py-8 sm:py-12">
        <div className="max-w-3xl">
          <pre className="whitespace-pre-wrap font-mono text-sm sm:text-base leading-relaxed">
            {rollup.body_md || "(empty)"}
          </pre>
        </div>
      </article>

      <footer className="px-5 sm:px-10 lg:px-16 py-6 border-t border-dashed border-[color:var(--color-divider)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span className="daybook-meta">
          Shared {sharedAtLabel(rollup.shared_at)}
        </span>
        <span className="daybook-meta">via Daybook</span>
      </footer>
    </main>
  );
}
