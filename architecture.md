# Architecture — The Dreaming Scallion Journal

## Overview

A personal, single-user journaling SPA. The app is a Vite + React + TypeScript
front end. Journal data is persisted server-side in **Cloudflare D1** and served,
together with the static app, by **Cloudflare Pages + Pages Functions**. The whole
stack lives in one Cloudflare project.

## Goals & decisions

- **Scope: one user, one journal.** No account/signup system — access is gated by a
  single shared password.
- **Database: Cloudflare D1** (serverless SQLite): native to Cloudflare, strongly
  consistent, generous free tier, room to grow.
- **localStorage stays as an offline cache.** D1 is the source of truth; the app still
  boots instantly and works offline, syncing when back online. Conflicts resolve
  last-write-wins (fine for a single user).

## The persisted document

The entire journal is one small JSON object (~2 KB seed, ~20–80 KB in real use, **no
inline media** — stickers are string keys into static assets):

```ts
interface JournalDoc {
  pages: Page[]
  sections: Section[]
  bookmark: number | null
  soundOn: boolean
}
```

Defined in `src/types.ts`. Because the app already reads and writes the document
atomically, it is stored as a single JSON blob rather than normalized tables.

## Components

```
Browser (Cloudflare Pages, static SPA)
  │
  ├─ localStorage 'journal.v3'      ← instant-boot cache / offline copy
  │                                   (no credentials stored client-side)
  │
  ├─ POST /api/login (password) ───► Pages Function → sets httpOnly session cookie
  │
  └─ fetch /api/journal  ──────────► Pages Function (functions/api/journal.ts)
        (cookie sent automatically)   │  verifies signed session cookie vs JOURNAL_SECRET
                                        └─► Cloudflare D1 (binding: DB)
                                              table journal: one row id='me'
```

### Frontend
- Built by Vite to `dist/`, served by Cloudflare Pages.
- `src/hooks/useJournal.ts` is the single persistence choke-point:
  - `init()` boots synchronously from the localStorage cache (or seed).
  - On mount, it calls `loadJournal()`; on success it dispatches a `hydrate` action to
    replace `pages/sections/bookmark/soundOn` with the server copy. If the server is
    empty it seeds the server with the current doc. A `401` triggers the lock screen.
  - Every edit writes the localStorage cache immediately and schedules a **debounced
    (800 ms) `saveJournal()`** so rapid edits don't spam D1.
  - A `readyRef` guard prevents a fresh device's cache/seed from overwriting the real
    server copy before the initial load resolves.
- `src/components/LockScreen.tsx` — password prompt shown when the API returns `401`
  (no valid session). On submit it calls `unlock()`, which logs in and retries the load.
- `src/lib/api.ts` — `login()` / `logout()` / `loadJournal()` / `saveJournal()`. `login()`
  POSTs the password to `/api/login`; the server sets an **httpOnly session cookie** that
  the browser then attaches automatically. The password is never stored on the client.

### Backend — Pages Functions
`functions/api/*.ts` (compiled by Cloudflare, outside the app's tsconfig), with shared
session helpers in `lib/session.ts`:

- **`POST /api/login`** → constant-time compares the password to `env.JOURNAL_SECRET`;
  on match, sets a signed, expiring **httpOnly session cookie** (`HttpOnly; Secure;
  SameSite=Strict`, 30-day TTL) so JS can never read it. `401` otherwise.
- **`POST /api/logout`** → clears the session cookie.
- **`GET /api/journal`** → `401` unless the request carries a valid session cookie; else
  returns `{ doc, updated_at }` (or `{ doc: null }` when empty, so the client falls back
  to the seed).
- **`PUT /api/journal`** → same auth; upserts the doc with `updated_at = Date.now()`.
- The session token is an HMAC-SHA-256-signed payload carrying an expiry; verification
  and the password compare both use a constant-time equality check. D1 is reached via the
  `DB` binding.

### Database — D1 schema
`schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS journal (
  id         TEXT PRIMARY KEY,      -- fixed slug; single-user app uses 'me'
  doc        TEXT NOT NULL,         -- JSON string of { pages, sections, bookmark, soundOn }
  updated_at INTEGER NOT NULL       -- epoch ms of the last write (last-write-wins)
);
```

One row (`id = 'me'`).

## Auth model

A single shared password, stored as the Cloudflare Pages secret `JOURNAL_SECRET`. The
client prompts for it once and POSTs it to `/api/login`; the Function compares it
server-side and, on success, issues a signed, expiring **httpOnly session cookie**. The
raw password is never persisted on the client — only the cookie, which JS cannot read
and the browser sends automatically on same-origin requests. This is what protects the
password from XSS / localStorage-scraping.

**Honest limitation:** a static SPA cannot hide a secret, so this is a password *gate*
(keeps random URL visitors out), not hardened multi-user auth. Appropriate for a
personal journal. Moving to real accounts later would mean a D1 `users` table (or an
auth provider) and per-user document rows.

## Configuration & tooling

- `wrangler.toml` — project name, `compatibility_date`, `pages_build_output_dir = "dist"`,
  and the D1 binding (`binding = "DB"`, `database_name = "journal-db"`, `database_id`).
- `.dev.vars` (gitignored) — local `JOURNAL_SECRET` for `wrangler pages dev`.
- `.gitignore` — ignores `node_modules/`, `dist/`, `.dev.vars`, `.wrangler/`.
- `package.json` scripts:
  - `build` — `tsc --noEmit && vite build`
  - `pages:dev` — `npm run build && wrangler pages dev dist`
  - `d1:migrate:local` / `d1:migrate:remote` — apply `schema.sql`

## Deploy

1. `npx wrangler login`
2. `npx wrangler d1 create journal-db` → put the `database_id` into `wrangler.toml`.
3. Cloudflare Pages dashboard: connect the GitHub repo, **root dir `/`**, build
   `npm run build`, output `dist`.
4. Pages settings: bind D1 (`DB` → `journal-db`) and add the secret `JOURNAL_SECRET`.
5. `npx wrangler d1 execute journal-db --remote --file=schema.sql`
6. Push to `master` → Pages builds and deploys.

## Notes

- **Local full-stack dev** requires macOS 13.5+ (Cloudflare's `workerd` runtime won't
  run below that). Deployment is unaffected — it runs on Cloudflare's servers.
- **Concurrency** is last-write-wins, which is fine for one user. Optional hardening:
  send `If-Match: <updated_at>` on PUT and `409` on mismatch to warn about a stale edit.
