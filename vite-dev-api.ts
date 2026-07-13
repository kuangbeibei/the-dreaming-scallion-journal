import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  COOKIE_NAME, clearCookie, createSessionToken, getCookie, safeEqual, sessionCookie, verifySessionToken,
} from './lib/session'

// Dev-only, in-process mock of the Cloudflare Pages Functions in functions/api/*.
//
// `npm run dev` runs Vite (front end only) with no backend, and `wrangler pages
// dev` needs a newer macOS than this machine (see CLAUDE.md). Without a backend,
// /api/journal 404s instead of 401-ing, so the password gate never triggers and
// login looks "unused" locally. This middleware reproduces the login / logout /
// journal routes in-process — the SAME session-cookie logic from lib/session.ts,
// backed by an in-memory doc store — so the full auth + persistence flow works
// under `npm run dev`. It is a dev construct only: configureServer never runs in
// a production build, and Cloudflare serves the real functions/ when deployed.

const SECRET = process.env.JOURNAL_SECRET || 'dev'

// Mirrors the single D1 row (id = 'me'). In-memory: resets when the dev server
// restarts, which is fine — the client re-seeds it from its localStorage cache.
let store: { doc: unknown; updated_at: number | null } = { doc: null, updated_at: null }

/** Adapt a Node request to a Web `Request` so lib/session.ts can be reused as-is. */
async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string') headers.set(k, v)
    else if (Array.isArray(v)) headers.set(k, v.join(', '))
  }
  let body: Buffer | undefined
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks: Buffer[] = []
    for await (const c of req) chunks.push(c as Buffer)
    body = Buffer.concat(chunks)
  }
  return new Request('http://localhost' + (req.url || '/'), { method: req.method, headers, body })
}

function send(res: ServerResponse, status: number, data: unknown, setCookie?: string): void {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  if (setCookie) res.setHeader('set-cookie', setCookie)
  res.end(JSON.stringify(data))
}

export function devApi(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url || '').split('?')[0]
        if (!path.startsWith('/api/')) return next()

        const request = await toWebRequest(req)
        try {
          if (path === '/api/login' && req.method === 'POST') {
            const { password } = (await request.json().catch(() => ({}))) as { password?: string }
            if (!safeEqual(password || '', SECRET)) return send(res, 401, { error: 'unauthorized' })
            const token = await createSessionToken(SECRET)
            return send(res, 200, { ok: true }, sessionCookie(token, request))
          }

          if (path === '/api/logout' && req.method === 'POST') {
            return send(res, 200, { ok: true }, clearCookie(request))
          }

          if (path === '/api/journal') {
            if (!(await verifySessionToken(SECRET, getCookie(request, COOKIE_NAME)))) {
              return send(res, 401, { error: 'unauthorized' })
            }
            if (req.method === 'GET') return send(res, 200, store)
            if (req.method === 'PUT') {
              const body = await request.json().catch(() => null)
              if (!body || typeof body !== 'object') return send(res, 400, { error: 'invalid body' })
              // Date.now() is fine here — dev server runs in plain Node.
              store = { doc: body, updated_at: Date.now() }
              return send(res, 200, { updated_at: store.updated_at })
            }
          }
        } catch (e) {
          return send(res, 500, { error: String(e) })
        }
        return next()
      })
      server.config.logger.info(`  \x1b[36m➜\x1b[0m  dev /api mock active — journal password: "${SECRET}"`)
    },
  }
}
