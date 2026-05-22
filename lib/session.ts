import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import type { Me } from "@/lib/types";

const SESSION_COOKIE = "__Host-daybook_session";
const CSRF_COOKIE = "daybook_csrf";

/**
 * Return the CSRF token from the current request, or self-issue one.
 *
 * In dev the Next.js app (:3000) and the Go backend (:8376) are different
 * origins, so the backend-issued daybook_csrf cookie is invisible to Next's
 * cookies(). The backend's double-submit check only requires the Cookie value
 * and the X-CSRF-Token header to match, so a Next-issued token works fine for
 * server-to-server calls. We also write it to the Next response so subsequent
 * browser visits reuse the same token instead of regenerating per request.
 */
export async function getCsrfToken(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(CSRF_COOKIE)?.value;
  if (existing) return existing;
  const token = randomBytes(32).toString("hex");
  jar.set({
    name: CSRF_COOKIE,
    value: token,
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return token;
}

export async function buildCookieHeader(): Promise<string> {
  await getCsrfToken();
  const jar = await cookies();
  const all = jar.getAll();
  return all.map((c) => `${c.name}=${encodeURIComponent(c.value)}`).join("; ");
}

export async function getMe(): Promise<Me | null> {
  const jar = await cookies();
  if (!jar.get(SESSION_COOKIE)) return null;
  const cookieHeader = await buildCookieHeader();
  try {
    return await apiFetch<Me>("/api/me", { cookieHeader });
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export async function requireMe(): Promise<Me> {
  const me = await getMe();
  if (!me) redirect("/login");
  return me;
}

