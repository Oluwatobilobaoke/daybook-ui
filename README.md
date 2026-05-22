# Daybook UI — Phase 1

Next.js 16 + React 19 frontend for the Daybook daily work log. Pairs with the
Go backend at `../daybook-golang-be`. Phase 1 is "Log it" only — auth,
clients, entries, plans, calendars, today-across-all-clients.

## Stack

- **Next.js 16.2.6** (App Router) + **React 19.2.6** + **TypeScript 6.0.3** (strict mode)
- **Tailwind CSS 4.3.0** via `@tailwindcss/postcss` (CSS-first config in `app/globals.css`)
- **Zod 4.4.3** for Server Action input validation
- **Geist + Geist Mono + Instrument Serif** via `next/font/google`
- Native `fetch` only (no axios/ky/swr/react-query); Server Components +
  Server Actions for data flow
- pnpm 10.22.0 with exact pins, lifecycle scripts ignored

### Supply-chain notes

- **No TanStack packages.** Per the May 11, 2026 Mini Shai-Hulud compromise,
  the `@tanstack/*` namespace is banned in Phase 1.
- **No utility libraries:** no `lodash`/`moment`/`date-fns`/`axios`/`clsx`/
  `classnames`/`tailwind-merge`. The tiny helpers we need are inline.
- **No markdown library** in Phase 1. The "What happened" field is a plain
  `<textarea>` with no live preview. Live preview (mentioned in
  `FE_PROMPT.md` but NOT in the PRD acceptance criteria) is **deferred** —
  the PRD only requires markdown storage, not rendering.
- **No date-picker library** — `<input type="date">` only.
- **No icon library** — every glyph is inline SVG.
- **No state management library** — `useState` and `useTransition` only.
- `.npmrc` sets `save-exact=true` and `ignore-scripts=true`.

## Quickstart

```
# 1) Install (lifecycle scripts blocked):
pnpm install --ignore-scripts

# 2) Start the backend in another shell:
cd ../daybook-golang-be && docker-compose up -d && make dev

# 3) Start the frontend:
pnpm dev
```

The frontend listens on `http://localhost:3000`; it expects the backend on
`http://localhost:8376`. Override with `NEXT_PUBLIC_API_BASE` in `.env.local`.

## Scripts

| Script           | What it does                                |
|------------------|---------------------------------------------|
| `pnpm dev`       | Run Next.js dev server                      |
| `pnpm build`     | Production build (the green-light check)    |
| `pnpm start`     | Serve the production build                  |
| `pnpm lint`      | `next lint` (ESLint flat config)            |
| `pnpm typecheck` | `tsc --noEmit`                              |

## Backend contract

We talk to the Go backend over `fetch` with `credentials: 'include'`. Two
cookies matter:

- `__Host-daybook_session` — issued by the backend after magic-link verify.
  `HttpOnly`, `Secure` in prod, `SameSite=Lax`. The frontend can't read it.
- `daybook_csrf` — non-HttpOnly double-submit token. We read it from
  `document.cookie` (browser) or `cookies()` (server) and mirror it into the
  `X-CSRF-Token` header on POST/PATCH/DELETE.

Source of truth: `daybook-golang-be/internal/httpx/middleware.go`,
`internal/auth/session.go`, and the per-domain handlers under
`internal/{auth,clients,entries,plans}`.

### Cookie name on dev

The session cookie name is always `__Host-daybook_session`. Modern browsers
allow the `__Host-` prefix on `http://localhost` without `Secure`, so the
cookie works in dev.

### Error shape

The backend returns `{code, message}` JSON for non-2xx responses (not
`{error}` as one early draft suggested). `lib/api.ts` parses both fields
into `ApiError`.

## Routes

| Path                              | Purpose                              | Phase 1 status        |
|-----------------------------------|--------------------------------------|-----------------------|
| `/`                               | Marketing (full brutalist treatment) | Implemented           |
| `/login`                          | Email-based magic-link sign-in       | Implemented (P1.1)    |
| `/app`                            | Today across all active clients      | Implemented (P1.7)    |
| `/app/c/[clientId]`               | Calendar view per client             | Implemented (P1.6)    |
| `/app/c/[clientId]/[date]`        | Day entry editor                     | Implemented (P1.3-P1.5)|
| `/app/settings`                   | Profile + Phase 3 placeholder        | Skeleton              |
| `/r/[token]`                      | Public read-only rollup              | Skeleton (Phase 3)    |

## Phase 1 features

- **Sign in (P1.1):** Email → `POST /api/auth/request` → "Check your inbox."
  429 → friendly rate-limit message. No password, no social.
- **Add/manage clients (P1.2):** Sidebar lists active clients with accent
  swatches. "+ New client" form → `POST /api/clients`. Edit/archive UI
  deferred to a small follow-up — backend supports it.
- **Today's entry (P1.3):** `/app/c/{id}/{today-date}` lazy-creates via
  `GET /api/clients/{id}/entries/today`. Two fields: a "What happened"
  markdown textarea and a "Plans" checkbox list.
- **Plans CRUD (P1.4):** add, edit-in-place, check/uncheck (with strike-
  through), delete, move up/down. No drag-and-drop.
- **Carry-forward (P1.5):** Done server-side. Carried plans render with a
  small "carried" pill referencing the source entry id.
- **Past entries (P1.6):** Calendar grid for `GET /api/clients/{id}/calendar
  ?month=YYYY-MM`. Days with entries render filled with the client's accent
  color. Click any day to backfill or edit. Prev/next day arrows + inline
  `<input type="date">`.
- **Today across all clients (P1.7):** `/app` server-renders `GET /api/today`
  and stacks every active client's editor inline.

## Design application

- Brutalism turned up on `/` and (eventually) `/r/[token]`; turned down
  inside `/app/*` (max heading size `text-4xl`, accent-orange reserved for
  primary CTAs and "today" indicators).
- Tokens live in `app/globals.css` under `@theme` so Tailwind v4 emits
  matching utilities (`bg-accent-orange`, `text-display`, …) and the CSS
  custom properties (`var(--color-accent-orange)`) are usable everywhere.
- Components: `Button`, `Input`, `Textarea`, `Card`, `StackDivider`,
  `DashedHr`, `Pill`. The `Pill` primitive is built even though Phase 1
  doesn't use the cyan/yellow ticket-status variants — Phase 2 will.
- Focus states: 2px outline + offset, applied via a single `:focus-visible`
  rule on body interactive elements.

## What's intentionally not in Phase 1

- No live markdown preview for the entry body. PRD does not require it; the
  user explicitly asked us to defer.
- No ticket-chip enrichment (Phase 2).
- No rollup generation or sharing UI beyond the `/r/[token]` skeleton (Phase 3).
- No client edit/archive controls in the sidebar — backend endpoints exist.

## Divergences from the spec

- Used Zod 4's top-level helpers (`z.email()`, `z.uuid()`) which were
  introduced in v4 and match the pinned `zod@4.4.3`.
- `tailwind.config.ts` is a near-stub; Tailwind v4 reads `@theme` from
  `app/globals.css` as the authoritative theme source.
- ESLint pinned to `9.39.4` (not 10.x) because the transitive plugins
  shipped with `eslint-config-next@16.2.6` (`eslint-plugin-import`,
  `eslint-plugin-react`, `eslint-plugin-jsx-a11y`) still cap their peer
  range at `^9`. Pinning 10 produced "unmet peer" warnings on every
  install.
- `@eslint/eslintrc@3.3.5` was added explicitly because `eslint.config.mjs`
  imports `FlatCompat` from it; the package is only transitive otherwise.
- Backend error JSON shape is `{code, message}`, not `{error}` as the prompt
  said; `lib/api.ts` follows the backend code.
