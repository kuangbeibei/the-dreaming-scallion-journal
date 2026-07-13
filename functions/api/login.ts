/// <reference types="@cloudflare/workers-types" />

// POST /api/login — verify the shared password, then issue a session cookie.
// The password is checked here and never stored on the client.

import { createSessionToken, safeEqual, sessionCookie } from '../../lib/session'

interface Env {
  JOURNAL_SECRET: string
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: unknown
  try { body = await request.json() } catch { return json({ error: 'invalid json' }, 400) }
  const password =
    body && typeof body === 'object' && typeof (body as { password?: unknown }).password === 'string'
      ? (body as { password: string }).password
      : ''

  if (!env.JOURNAL_SECRET || !safeEqual(password, env.JOURNAL_SECRET)) {
    return json({ error: 'unauthorized' }, 401)
  }

  const token = await createSessionToken(env.JOURNAL_SECRET)
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'Set-Cookie': sessionCookie(token, request),
    },
  })
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
