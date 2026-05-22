import { requireMe } from "@/lib/session";
import { apiFetch } from "@/lib/api";
import { buildCookieHeader } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import type { Client } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await requireMe();
  const cookieHeader = await buildCookieHeader();
  const clients = await apiFetch<Client[]>("/api/clients", { cookieHeader });

  return (
    <AppShell clients={clients} userEmail={me.email}>
      {children}
    </AppShell>
  );
}
