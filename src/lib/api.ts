import type { JournalDoc } from '../types'

// Talks to the /api/journal Pages Function. Single-user: the whole document is
// sent/received as one JSON blob, gated by a shared password (Bearer token).

const ENDPOINT = '/api/journal'
const PASSWORD_KEY = 'journal.password'

export class UnauthorizedError extends Error {
  constructor() {
    super('unauthorized')
    this.name = 'UnauthorizedError'
  }
}

export function getPassword(): string | null {
  try { return localStorage.getItem(PASSWORD_KEY) } catch { return null }
}

export function setPassword(pw: string): void {
  try { localStorage.setItem(PASSWORD_KEY, pw) } catch { /* ignore */ }
}

export function clearPassword(): void {
  try { localStorage.removeItem(PASSWORD_KEY) } catch { /* ignore */ }
}

function authHeaders(): Record<string, string> {
  const pw = getPassword()
  return pw ? { authorization: 'Bearer ' + pw } : {}
}

export interface LoadResult {
  doc: JournalDoc | null
  updated_at: number | null
}

/** Fetch the server copy. Throws UnauthorizedError on 401 so callers can prompt. */
export async function loadJournal(): Promise<LoadResult> {
  const res = await fetch(ENDPOINT, { headers: authHeaders() })
  if (res.status === 401) throw new UnauthorizedError()
  if (!res.ok) throw new Error('load failed: ' + res.status)
  return (await res.json()) as LoadResult
}

/** Upsert the server copy. Returns the new server timestamp. */
export async function saveJournal(doc: JournalDoc): Promise<number> {
  const res = await fetch(ENDPOINT, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', ...authHeaders() },
    body: JSON.stringify(doc),
  })
  if (res.status === 401) throw new UnauthorizedError()
  if (!res.ok) throw new Error('save failed: ' + res.status)
  const data = (await res.json()) as { updated_at: number }
  return data.updated_at
}
