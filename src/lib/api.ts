import type { JournalDoc } from '../types'

// Talks to the /api/journal Pages Function. Single-user: the whole document is
// sent/received as one JSON blob. Auth is a session cookie set by /api/login —
// the password is never stored on the client, and the cookie is httpOnly so JS
// cannot read it; the browser sends it automatically on same-origin requests.

const ENDPOINT = '/api/journal'

export class UnauthorizedError extends Error {
  constructor() {
    super('unauthorized')
    this.name = 'UnauthorizedError'
  }
}

/** Exchange the password for a session cookie. Returns false on wrong password. */
export async function login(password: string): Promise<boolean> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  return res.ok
}

/** Clear the session cookie server-side. */
export async function logout(): Promise<void> {
  try { await fetch('/api/logout', { method: 'POST' }) } catch { /* ignore */ }
}

export interface LoadResult {
  doc: JournalDoc | null
  updated_at: number | null
}

/** Fetch the server copy. Throws UnauthorizedError on 401 so callers can prompt. */
export async function loadJournal(): Promise<LoadResult> {
  const res = await fetch(ENDPOINT)
  if (res.status === 401) throw new UnauthorizedError()
  if (!res.ok) throw new Error('load failed: ' + res.status)
  return (await res.json()) as LoadResult
}

/** Upsert the server copy. Returns the new server timestamp. */
export async function saveJournal(doc: JournalDoc): Promise<number> {
  const res = await fetch(ENDPOINT, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(doc),
  })
  if (res.status === 401) throw new UnauthorizedError()
  if (!res.ok) throw new Error('save failed: ' + res.status)
  const data = (await res.json()) as { updated_at: number }
  return data.updated_at
}
