"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClientSidebar } from "@/components/ClientSidebar";
import type { Client } from "@/lib/types";

type Props = {
  clients: Client[];
  userEmail: string;
  children: React.ReactNode;
};

export function AppShell({ clients, userEmail, children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen lg:flex">
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 border-b border-[color:var(--color-divider)] bg-[color:var(--color-bg)]">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          aria-controls="app-sidebar-drawer"
          aria-expanded={drawerOpen}
          className="p-2 -ml-2 rounded-sm"
        >
          <MenuIcon />
        </button>
        <Link href="/app" className="daybook-display text-xl tracking-tight">
          Daybook
        </Link>
        <span aria-hidden="true" className="w-9" />
      </header>

      <div className="hidden lg:block">
        <ClientSidebar clients={clients} userEmail={userEmail} />
      </div>

      {drawerOpen ? (
        <>
          <div
            aria-hidden="true"
            onClick={() => setDrawerOpen(false)}
            className="lg:hidden fixed inset-0 z-40 bg-[rgba(43,43,43,0.55)]"
          />
          <div
            id="app-sidebar-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="lg:hidden fixed inset-y-0 left-0 z-50 max-w-[85vw]"
          >
            <ClientSidebar
              clients={clients}
              userEmail={userEmail}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </>
      ) : null}

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
