"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AccentColorPicker } from "@/components/AccentColorPicker";
import {
  archiveClientAction,
  createClientAction,
  logoutAction,
  unarchiveClientAction,
  updateClientAction,
} from "@/app/actions";
import type { Client } from "@/lib/types";

type Props = {
  clients: Client[];
  userEmail: string;
  onNavigate?: () => void;
};

export function ClientSidebar({ clients, userEmail, onNavigate }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [archivedOpen, setArchivedOpen] = useState(false);

  function onCreate(formData: FormData) {
    startTransition(async () => {
      const res = await createClientAction(formData);
      if (res.ok) {
        setOpen(false);
        setError(null);
      } else {
        setError(res.message);
      }
    });
  }

  const active = clients.filter((c) => !c.archived);
  const archived = clients.filter((c) => c.archived);

  return (
    <aside className="border-r border-[color:var(--color-divider)] bg-[color:var(--color-bg)] flex flex-col h-full w-64 min-w-64 p-5">
      <Link
        href="/app"
        onClick={onNavigate}
        className="block mb-6 daybook-display text-2xl tracking-tight"
      >
        Daybook
      </Link>

      <div className="daybook-meta mb-3">Clients</div>
      <nav className="flex flex-col gap-1 overflow-y-auto flex-1">
        {active.length === 0 ? (
          <span className="text-sm text-[color:var(--color-muted)]">
            No clients yet.
          </span>
        ) : (
          active.map((c) =>
            editingId === c.id ? (
              <EditClientForm
                key={c.id}
                client={c}
                onDone={() => setEditingId(null)}
              />
            ) : (
              <ClientRow
                key={c.id}
                client={c}
                pathname={pathname}
                onEdit={() => setEditingId(c.id)}
                onNavigate={onNavigate}
              />
            ),
          )
        )}
      </nav>

      <div className="mt-3">
        {open ? (
          <form
            action={onCreate}
            className="border border-[color:var(--color-fg)] rounded-sm p-3 flex flex-col gap-3"
          >
            <label className="daybook-meta" htmlFor="client-name">
              New client name
            </label>
            <Input
              id="client-name"
              name="name"
              placeholder="e.g. Acme Corp"
              required
            />
            <AccentColorPicker name="accent_color" />
            {error ? (
              <p className="text-sm text-[color:var(--color-accent-orange)]">
                {error}
              </p>
            ) : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Adding..." : "Add"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setOpen(true)}
          >
            + New client
          </Button>
        )}
      </div>

      {archived.length > 0 ? (
        <>
          <hr className="daybook-dashed-hr my-4" />
          <button
            type="button"
            onClick={() => setArchivedOpen((v) => !v)}
            className="daybook-meta text-left hover:opacity-80 flex items-center justify-between"
            aria-expanded={archivedOpen}
          >
            <span>Archived ({archived.length})</span>
            <span aria-hidden="true">{archivedOpen ? "−" : "+"}</span>
          </button>
          {archivedOpen ? (
            <ul className="mt-2 flex flex-col gap-1">
              {archived.map((c) => (
                <ArchivedRow key={c.id} client={c} />
              ))}
            </ul>
          ) : null}
        </>
      ) : null}

      <hr className="daybook-dashed-hr my-5" />

      <div className="flex flex-col gap-2 text-sm">
        <Link
          href="/app/settings"
          onClick={onNavigate}
          className="hover:underline underline-offset-2"
        >
          Settings
        </Link>
        <span className="daybook-meta truncate" title={userEmail}>
          {userEmail}
        </span>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-left hover:underline underline-offset-2 text-sm"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

function ClientRow({
  client,
  pathname,
  onEdit,
  onNavigate,
}: {
  client: Client;
  pathname: string | null;
  onEdit: () => void;
  onNavigate?: () => void;
}) {
  const href = `/app/c/${client.id}`;
  const isActive = pathname === href || pathname?.startsWith(href + "/");
  return (
    <div
      className={`group flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm transition-opacity ${
        isActive
          ? "bg-[color:var(--color-fg)] text-[color:var(--color-bg)]"
          : "hover:opacity-80"
      }`}
    >
      <Link href={href} onClick={onNavigate} className="flex items-center gap-2 flex-1 min-w-0">
        <span
          aria-hidden="true"
          className="w-3 h-3 rounded-sm border border-[color:var(--color-fg)] shrink-0"
          style={{ backgroundColor: client.accent_color }}
        />
        <span className="truncate">{client.name}</span>
      </Link>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${client.name}`}
        className="opacity-60 lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-1 -mr-1 rounded-sm"
      >
        <PencilIcon />
      </button>
    </div>
  );
}

function EditClientForm({
  client,
  onDone,
}: {
  client: Client;
  onDone: () => void;
}) {
  const [name, setName] = useState(client.name);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const accentColor = String(formData.get("accent_color") ?? client.accent_color);
    startTransition(async () => {
      const res = await updateClientAction({
        clientId: client.id,
        name: name.trim() || undefined,
        accentColor,
      });
      if (res.ok) {
        setError(null);
        onDone();
      } else {
        setError(res.message);
      }
    });
  }

  function onArchive() {
    startTransition(async () => {
      const res = await archiveClientAction({ clientId: client.id });
      if (res.ok) {
        setError(null);
        onDone();
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <form
      action={onSubmit}
      className="border border-[color:var(--color-fg)] rounded-sm p-3 flex flex-col gap-3"
    >
      <label className="daybook-meta" htmlFor={`name-${client.id}`}>
        Edit client
      </label>
      <Input
        id={`name-${client.id}`}
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <AccentColorPicker name="accent_color" initial={client.accent_color} />
      {error ? (
        <p className="text-sm text-[color:var(--color-accent-orange)]">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2 flex-wrap">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setError(null);
            onDone();
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onArchive}
          disabled={pending}
        >
          Archive
        </Button>
      </div>
    </form>
  );
}

function ArchivedRow({ client }: { client: Client }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onUnarchive() {
    startTransition(async () => {
      const res = await unarchiveClientAction({ clientId: client.id });
      if (!res.ok) setError(res.message);
    });
  }

  return (
    <li className="flex items-center gap-2 text-sm text-[color:var(--color-muted)]">
      <span
        aria-hidden="true"
        className="w-3 h-3 rounded-sm border border-[color:var(--color-fg)] shrink-0 opacity-60"
        style={{ backgroundColor: client.accent_color }}
      />
      <span className="truncate flex-1" title={client.name}>
        {client.name}
      </span>
      <button
        type="button"
        onClick={onUnarchive}
        disabled={pending}
        className="text-xs underline underline-offset-2 hover:opacity-80 disabled:opacity-50"
      >
        {pending ? "..." : "Unarchive"}
      </button>
      {error ? (
        <span className="sr-only" role="alert">
          {error}
        </span>
      ) : null}
    </li>
  );
}

function PencilIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      <path d="M3 21l3.6-.9L19 7.7l-2.7-2.7L4 17.4 3 21z" />
      <path d="M14.5 6.5l3 3" />
    </svg>
  );
}
