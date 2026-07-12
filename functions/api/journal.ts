/// <reference types="@cloudflare/workers-types" />

// Cloudflare Pages Function backing GET/PUT /api/journal.
// Single-user: one row (id = 'me') holds the whole journal document as JSON.

interface Env {
  DB: D1Database
  JOURNAL_SECRET: string
}

const ROW_ID = 'me'

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })

/** Constant-time string compare to avoid leaking the secret via timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function authed(request: Request, env: Env): boolean {
  const header = request.headers.get('authorization') || ''
  const token = header.replace(/^Bearer\s+/i, '')
  return Boolean(env.JOURNAL_SECRET) && safeEqual(token, env.JOURNAL_SECRET)
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!authed(request, env)) return json({ error: 'unauthorized' }, 401)

  const row = await env.DB
    .prepare('SELECT doc, updated_at FROM journal WHERE id = ?')
    .bind(ROW_ID)
    .first<{ doc: string; updated_at: number }>()

  if (!row) return json({ doc: null, updated_at: null })

  // doc is stored as a JSON string; parse so the client gets a real object.
  let doc: unknown = null
  try { doc = JSON.parse(row.doc) } catch { doc = null }
  return json({ doc, updated_at: row.updated_at })
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  if (!authed(request, env)) return json({ error: 'unauthorized' }, 401)

  let body: unknown
  try { body = await request.json() } catch { return json({ error: 'invalid json' }, 400) }
  if (!body || typeof body !== 'object') return json({ error: 'invalid body' }, 400)

  const updated_at = Date.now()
  await env.DB
    .prepare(
      `INSERT INTO journal (id, doc, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET doc = excluded.doc, updated_at = excluded.updated_at`,
    )
    .bind(ROW_ID, JSON.stringify(body), updated_at)
    .run()

  return json({ updated_at })
}
