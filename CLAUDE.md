# CLAUDE.md

The Dreaming Scallion — a personal, single-user journaling SPA (Vite + React + TypeScript),
deployed on Cloudflare Pages with data persisted in Cloudflare D1.

## Docs

- [architecture.md](./architecture.md) — how it's built: D1 + Pages Functions design, the
  `JournalDoc` shape, the persistence flow in `useJournal.ts`, the password-gate auth model.
- [deploy.md](./deploy.md) — how to deploy to Cloudflare, the exact steps used, and the
  pitfalls hit along the way (`wrangler pages deploy` vs `wrangler deploy`, wrangler version,
  preview vs production URL).

## Commands

```bash
npm run dev      # local Vite dev server (front end only)
npm run build    # tsc --noEmit && vite build → dist/
npm run typecheck
# deploy: see deploy.md (npx wrangler pages deploy dist --project-name the-dreaming-scallion-journal)
```

## Key facts

- **Single user, one journal.** Access is gated by a shared password (`JOURNAL_SECRET`), not
  a full account system.
- **Data model:** the whole journal is one JSON blob `{ pages, sections, bookmark, soundOn }`
  (`src/types.ts`), stored as a single D1 row (`schema.sql`), no inline media.
- **Persistence choke-point:** `src/hooks/useJournal.ts` — boots from the localStorage cache,
  hydrates from D1 on mount, debounced save on edit. `src/lib/api.ts` is the API client.
- **Backend:** `functions/api/journal.ts` (Cloudflare Pages Function, outside the app tsconfig).
- **Local limitation:** the Cloudflare `workerd` runtime needs macOS 13.5+, so `wrangler pages
  dev` won't run on this Mac (13.1). Deployment is unaffected — it runs on Cloudflare's servers.
