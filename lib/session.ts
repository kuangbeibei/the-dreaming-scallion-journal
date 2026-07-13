// Shared session helpers for the Pages Functions (not a route — lives outside
// functions/). A session is a signed, expiring token kept in an httpOnly cookie;
// the password itself is never stored client-side.

const enc = new TextEncoder()

export const COOKIE_NAME = 'session'
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function b64urlFromBytes(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const b64urlFromString = (str: string) => b64urlFromBytes(enc.encode(str))
const stringFromB64url = (b64: string) => atob(b64.replace(/-/g, '+').replace(/_/g, '/'))

/** Constant-time string compare (avoids leaking secrets via timing). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function hmacB64url(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return b64urlFromBytes(new Uint8Array(sig))
}

/** Create a `<payload>.<sig>` token whose payload carries an expiry. */
export async function createSessionToken(secret: string, ttlMs = SESSION_TTL_MS): Promise<string> {
  const payload = b64urlFromString(JSON.stringify({ exp: Date.now() + ttlMs }))
  const sig = await hmacB64url(secret, payload)
  return payload + '.' + sig
}

/** Verify signature and expiry of a session token. */
export async function verifySessionToken(secret: string, token: string | null): Promise<boolean> {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot < 0) return false
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = await hmacB64url(secret, payload)
  if (!safeEqual(sig, expected)) return false
  try {
    const { exp } = JSON.parse(stringFromB64url(payload))
    return typeof exp === 'number' && Date.now() < exp
  } catch { return false }
}

export function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie') || ''
  for (const part of header.split(/;\s*/)) {
    const eq = part.indexOf('=')
    if (eq > 0 && part.slice(0, eq) === name) return part.slice(eq + 1)
  }
  return null
}

// `Secure` only over https so the cookie also works on http://localhost in dev.
const secureAttr = (request: Request) =>
  new URL(request.url).protocol === 'https:' ? '; Secure' : ''

export function sessionCookie(token: string, request: Request, ttlMs = SESSION_TTL_MS): string {
  return `${COOKIE_NAME}=${token}; HttpOnly${secureAttr(request)}; SameSite=Strict; Path=/; Max-Age=${Math.floor(ttlMs / 1000)}`
}

export function clearCookie(request: Request): string {
  return `${COOKIE_NAME}=; HttpOnly${secureAttr(request)}; SameSite=Strict; Path=/; Max-Age=0`
}
