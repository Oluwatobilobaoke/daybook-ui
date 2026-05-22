"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { apiFetch, ApiError } from "@/lib/api";
import { buildCookieHeader, getCsrfToken } from "@/lib/session";
import type {
  Client,
  Entry,
  Me,
  Plan,
  PolishResult,
  Rollup,
} from "@/lib/types";

const hex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

const createClientSchema = z.object({
  name: z.string().min(1).max(120),
  accent_color: z.string().regex(hex),
});

const updateClientSchema = z.object({
  client_id: z.uuid(),
  name: z.string().min(1).max(120).optional(),
  accent_color: z.string().regex(hex).optional(),
});

const clientIdSchema = z.object({ client_id: z.uuid() });

const patchEntrySchema = z.object({
  entry_id: z.uuid(),
  what_happened_md: z.string(),
});

const createPlanSchema = z.object({
  entry_id: z.uuid(),
  text: z.string().min(1),
});

const updatePlanSchema = z.object({
  plan_id: z.uuid(),
  text: z.string().min(1).optional(),
  done: z.boolean().optional(),
});

const movePlanSchema = z.object({
  plan_id: z.uuid(),
  direction: z.enum(["up", "down"]),
});

const deletePlanSchema = z.object({
  plan_id: z.uuid(),
});

async function authedFetch<T>(
  path: string,
  init: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown } = {},
): Promise<T> {
  const cookieHeader = await buildCookieHeader();
  const csrfToken = await getCsrfToken();
  return apiFetch<T>(path, {
    method: init.method,
    body: init.body,
    cookieHeader,
    csrfToken,
  });
}

export async function requestMagicLinkAction(formData: FormData): Promise<
  | { ok: true; email: string }
  | { ok: false; rateLimited?: boolean; message: string }
> {
  const email = String(formData.get("email") ?? "").trim();
  const parsed = z.string().email().safeParse(email);
  if (!parsed.success) {
    return { ok: false, message: "Enter a valid email address." };
  }
  try {
    await authedFetch<{ ok: boolean }>("/api/auth/request", {
      method: "POST",
      body: { email },
    });
    return { ok: true, email };
  } catch (err) {
    if (err instanceof ApiError && err.status === 429) {
      return {
        ok: false,
        rateLimited: true,
        message: "Too many attempts — try again in a minute.",
      };
    }
    if (err instanceof ApiError) {
      return { ok: false, message: err.message };
    }
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}

export async function logoutAction(): Promise<void> {
  try {
    await authedFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
  } catch {
    // Ignore — cookie may already be invalid.
  }
  redirect("/login");
}

export async function createClientAction(formData: FormData): Promise<
  { ok: true; client: Client } | { ok: false; message: string }
> {
  const parsed = createClientSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    accent_color: String(formData.get("accent_color") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: "Name and a valid hex color are required." };
  }
  try {
    const client = await authedFetch<Client>("/api/clients", {
      method: "POST",
      body: parsed.data,
    });
    revalidatePath("/app");
    revalidatePath("/app", "layout");
    return { ok: true, client };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof ApiError ? err.message : "Could not create client.",
    };
  }
}

export async function updateClientAction(input: {
  clientId: string;
  name?: string;
  accentColor?: string;
}): Promise<{ ok: true; client: Client } | { ok: false; message: string }> {
  const parsed = updateClientSchema.safeParse({
    client_id: input.clientId,
    name: input.name,
    accent_color: input.accentColor,
  });
  if (!parsed.success) {
    return { ok: false, message: "Invalid client update." };
  }
  const body: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) body.name = parsed.data.name;
  if (parsed.data.accent_color !== undefined)
    body.accent_color = parsed.data.accent_color;
  try {
    const client = await authedFetch<Client>(
      `/api/clients/${parsed.data.client_id}`,
      { method: "PATCH", body },
    );
    revalidatePath("/app", "layout");
    return { ok: true, client };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof ApiError ? err.message : "Could not update client.",
    };
  }
}

export async function archiveClientAction(input: { clientId: string }): Promise<
  { ok: true; client: Client } | { ok: false; message: string }
> {
  const parsed = clientIdSchema.safeParse({ client_id: input.clientId });
  if (!parsed.success) return { ok: false, message: "Invalid client id." };
  try {
    const client = await authedFetch<Client>(
      `/api/clients/${parsed.data.client_id}/archive`,
      { method: "POST" },
    );
    revalidatePath("/app", "layout");
    return { ok: true, client };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof ApiError ? err.message : "Could not archive client.",
    };
  }
}

export async function unarchiveClientAction(input: {
  clientId: string;
}): Promise<{ ok: true; client: Client } | { ok: false; message: string }> {
  const parsed = clientIdSchema.safeParse({ client_id: input.clientId });
  if (!parsed.success) return { ok: false, message: "Invalid client id." };
  try {
    const client = await authedFetch<Client>(
      `/api/clients/${parsed.data.client_id}/unarchive`,
      { method: "POST" },
    );
    revalidatePath("/app", "layout");
    return { ok: true, client };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof ApiError ? err.message : "Could not unarchive client.",
    };
  }
}

export async function patchEntryAction(input: {
  entryId: string;
  whatHappenedMd: string;
}): Promise<{ ok: true; entry: Entry } | { ok: false; message: string }> {
  const parsed = patchEntrySchema.safeParse({
    entry_id: input.entryId,
    what_happened_md: input.whatHappenedMd,
  });
  if (!parsed.success) {
    return { ok: false, message: "Invalid input." };
  }
  try {
    const entry = await authedFetch<Entry>(
      `/api/entries/${parsed.data.entry_id}`,
      {
        method: "PATCH",
        body: { what_happened_md: parsed.data.what_happened_md },
      },
    );
    return { ok: true, entry };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof ApiError ? err.message : "Save failed.",
    };
  }
}

export async function createPlanAction(input: {
  entryId: string;
  text: string;
}): Promise<{ ok: true; plan: Plan } | { ok: false; message: string }> {
  const parsed = createPlanSchema.safeParse({
    entry_id: input.entryId,
    text: input.text,
  });
  if (!parsed.success) return { ok: false, message: "Plan text required." };
  try {
    const plan = await authedFetch<Plan>(
      `/api/entries/${parsed.data.entry_id}/plans`,
      {
        method: "POST",
        body: { text: parsed.data.text },
      },
    );
    return { ok: true, plan };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof ApiError ? err.message : "Could not add plan.",
    };
  }
}

export async function updatePlanAction(input: {
  planId: string;
  text?: string;
  done?: boolean;
}): Promise<{ ok: true; plan: Plan } | { ok: false; message: string }> {
  const parsed = updatePlanSchema.safeParse({
    plan_id: input.planId,
    text: input.text,
    done: input.done,
  });
  if (!parsed.success) return { ok: false, message: "Invalid input." };
  try {
    const body: Record<string, unknown> = {};
    if (parsed.data.text !== undefined) body.text = parsed.data.text;
    if (parsed.data.done !== undefined) body.done = parsed.data.done;
    const plan = await authedFetch<Plan>(
      `/api/plans/${parsed.data.plan_id}`,
      { method: "PATCH", body },
    );
    return { ok: true, plan };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof ApiError ? err.message : "Could not update plan.",
    };
  }
}

export async function movePlanAction(input: {
  planId: string;
  direction: "up" | "down";
}): Promise<{ ok: true; plan: Plan } | { ok: false; message: string }> {
  const parsed = movePlanSchema.safeParse({
    plan_id: input.planId,
    direction: input.direction,
  });
  if (!parsed.success) return { ok: false, message: "Invalid direction." };
  try {
    const plan = await authedFetch<Plan>(
      `/api/plans/${parsed.data.plan_id}/move`,
      {
        method: "POST",
        body: { direction: parsed.data.direction },
      },
    );
    return { ok: true, plan };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof ApiError ? err.message : "Could not move plan.",
    };
  }
}

export async function deletePlanAction(input: { planId: string }): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const parsed = deletePlanSchema.safeParse({ plan_id: input.planId });
  if (!parsed.success) return { ok: false, message: "Invalid plan id." };
  try {
    await authedFetch<void>(`/api/plans/${parsed.data.plan_id}`, {
      method: "DELETE",
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof ApiError ? err.message : "Could not delete plan.",
    };
  }
}

export async function createEntryForDateAction(input: {
  clientId: string;
  date: string; // YYYY-MM-DD
}): Promise<{ ok: true; entry: Entry } | { ok: false; message: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(input.clientId))
    return { ok: false, message: "Invalid client id." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date))
    return { ok: false, message: "Invalid date." };
  try {
    const entry = await authedFetch<Entry>(
      `/api/clients/${input.clientId}/entries/${input.date}`,
      { method: "POST" },
    );
    return { ok: true, entry };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof ApiError ? err.message : "Could not create entry.",
    };
  }
}

const uuidSchema = z.uuid();
const polishKindSchema = z.enum(["entry", "rollup"]);

export async function polishAction(input: {
  text: string;
  kind?: "entry" | "rollup";
}): Promise<
  | { ok: true; polished: string; model: string; event_id?: string }
  | { ok: false; message: string; rateLimited?: boolean }
> {
  if (!input.text || input.text.trim() === "") {
    return { ok: false, message: "Nothing to polish yet." };
  }
  const kind = polishKindSchema.safeParse(input.kind ?? "entry");
  if (!kind.success) return { ok: false, message: "Invalid polish kind." };
  try {
    const out = await authedFetch<PolishResult>("/api/polish", {
      method: "POST",
      body: {
        text: input.text,
        kind: kind.data,
      },
    });
    return {
      ok: true,
      polished: out.polished,
      model: out.model,
      event_id: out.event_id,
    };
  } catch (err) {
    if (err instanceof ApiError) {
      const rateLimited =
        err.status === 429 || err.code === "llm_rate_limited";
      return {
        ok: false,
        rateLimited,
        message: rateLimited
          ? "Rate limit reached — try again in a minute."
          : err.message,
      };
    }
    return { ok: false, message: "Polish failed." };
  }
}

const ymdSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

export async function regenerateRollupAction(input: {
  clientId: string;
  weekStart: string;
}): Promise<{ ok: true; rollup: Rollup } | { ok: false; message: string }> {
  const cid = uuidSchema.safeParse(input.clientId);
  const ws = ymdSchema.safeParse(input.weekStart);
  if (!cid.success || !ws.success) {
    return { ok: false, message: "Invalid input." };
  }
  try {
    const rollup = await authedFetch<Rollup>(
      `/api/clients/${cid.data}/rollups/${ws.data}`,
      { method: "POST" },
    );
    revalidatePath(`/app/c/${cid.data}/rollups/${ws.data}`);
    return { ok: true, rollup };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof ApiError ? err.message : "Could not generate rollup.",
    };
  }
}

export async function shareRollupAction(input: {
  rollupId: string;
  clientId: string;
  weekStart: string;
}): Promise<{ ok: true; rollup: Rollup } | { ok: false; message: string }> {
  const id = uuidSchema.safeParse(input.rollupId);
  if (!id.success) return { ok: false, message: "Invalid rollup id." };
  try {
    const rollup = await authedFetch<Rollup>(
      `/api/rollups/${id.data}/share`,
      { method: "POST" },
    );
    revalidatePath(`/app/c/${input.clientId}/rollups/${input.weekStart}`);
    return { ok: true, rollup };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof ApiError ? err.message : "Could not share rollup.",
    };
  }
}

export async function revokeRollupAction(input: {
  rollupId: string;
  clientId: string;
  weekStart: string;
}): Promise<{ ok: true; rollup: Rollup } | { ok: false; message: string }> {
  const id = uuidSchema.safeParse(input.rollupId);
  if (!id.success) return { ok: false, message: "Invalid rollup id." };
  try {
    const rollup = await authedFetch<Rollup>(
      `/api/rollups/${id.data}/revoke`,
      { method: "POST" },
    );
    revalidatePath(`/app/c/${input.clientId}/rollups/${input.weekStart}`);
    return { ok: true, rollup };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof ApiError ? err.message : "Could not revoke share.",
    };
  }
}

export async function patchRollupAction(input: {
  rollupId: string;
  editedMd: string | null;
}): Promise<{ ok: true; rollup: Rollup } | { ok: false; message: string }> {
  const id = uuidSchema.safeParse(input.rollupId);
  if (!id.success) return { ok: false, message: "Invalid rollup id." };
  try {
    const rollup = await authedFetch<Rollup>(`/api/rollups/${id.data}`, {
      method: "PATCH",
      body: { edited_md: input.editedMd },
    });
    return { ok: true, rollup };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof ApiError ? err.message : "Save failed.",
    };
  }
}

const hourOrNull = z.number().int().min(0).max(23).nullable();

const patchMeSchema = z.object({
  timezone: z.string().min(1).max(64),
  morning_reminder_hour: hourOrNull,
  evening_reminder_hour: hourOrNull,
  weekly_reminder_hour: hourOrNull,
});

export async function patchMeAction(input: {
  timezone: string;
  morningHour: number | null;
  eveningHour: number | null;
  weeklyHour: number | null;
}): Promise<{ ok: true; me: Me } | { ok: false; message: string }> {
  const parsed = patchMeSchema.safeParse({
    timezone: input.timezone.trim(),
    morning_reminder_hour: input.morningHour,
    evening_reminder_hour: input.eveningHour,
    weekly_reminder_hour: input.weeklyHour,
  });
  if (!parsed.success) {
    return { ok: false, message: "Invalid settings." };
  }
  try {
    const me = await authedFetch<Me>("/api/me", {
      method: "PATCH",
      body: parsed.data,
    });
    revalidatePath("/app/settings");
    revalidatePath("/app", "layout");
    return { ok: true, me };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof ApiError ? err.message : "Could not save settings.",
    };
  }
}
