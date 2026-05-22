import type { APIError } from "@/lib/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") ||
  "http://localhost:8376";

const CSRF_COOKIE = "daybook_csrf";
const CSRF_HEADER = "X-CSRF-Token";

export type FetchOpts = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  cookieHeader?: string;
  csrfToken?: string;
  cache?: RequestCache;
  signal?: AbortSignal;
};

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function readCookieFromHeader(
  header: string | undefined,
  name: string,
): string | undefined {
  if (!header) return undefined;
  const parts = header.split(/;\s*/);
  for (const p of parts) {
    const eq = p.indexOf("=");
    if (eq === -1) continue;
    if (p.slice(0, eq) === name) {
      return decodeURIComponent(p.slice(eq + 1));
    }
  }
  return undefined;
}

export function readBrowserCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return readCookieFromHeader(document.cookie, name);
}

function isUnsafe(method: string): boolean {
  return method === "POST" || method === "PATCH" || method === "DELETE";
}

export async function apiFetch<T>(
  path: string,
  opts: FetchOpts = {},
): Promise<T> {
  const method = opts.method ?? "GET";
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  if (isUnsafe(method)) {
    const token =
      opts.csrfToken ??
      readCookieFromHeader(opts.cookieHeader, CSRF_COOKIE) ??
      readBrowserCookie(CSRF_COOKIE);
    if (token) headers[CSRF_HEADER] = token;
  }

  if (opts.cookieHeader && typeof document === "undefined") {
    headers["Cookie"] = opts.cookieHeader;
  }

  const init: RequestInit = {
    method,
    headers,
    credentials: "include",
    cache: opts.cache ?? "no-store",
    signal: opts.signal,
  };
  if (opts.body !== undefined) {
    init.body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, init);

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  let parsed: unknown = undefined;
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {}
  }

  if (!res.ok) {
    const err = (parsed ?? {}) as Partial<APIError>;
    const code = typeof err.code === "string" ? err.code : "http_error";
    const message =
      typeof err.message === "string" ? err.message : `HTTP ${res.status}`;
    throw new ApiError(res.status, code, message);
  }

  return parsed as T;
}
