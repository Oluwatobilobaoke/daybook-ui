const CSRF_COOKIE = "daybook_csrf";

export function readCsrfFromDocument(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const parts = document.cookie.split(/;\s*/);
  for (const p of parts) {
    const eq = p.indexOf("=");
    if (eq === -1) continue;
    if (p.slice(0, eq) === CSRF_COOKIE) {
      return decodeURIComponent(p.slice(eq + 1));
    }
  }
  return undefined;
}

export async function ensureCsrf(apiBase: string): Promise<void> {
  if (readCsrfFromDocument()) return;
  try {
    await fetch(`${apiBase}/healthz`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
  } catch {}
}
