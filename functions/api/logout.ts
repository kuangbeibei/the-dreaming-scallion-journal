/// <reference types="@cloudflare/workers-types" />

// POST /api/logout — clear the session cookie.

import { clearCookie } from '../../lib/session'

export const onRequestPost: PagesFunction = async ({ request }) => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'Set-Cookie': clearCookie(request),
    },
  })
}
