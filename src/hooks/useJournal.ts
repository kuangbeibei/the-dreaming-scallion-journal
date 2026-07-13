import { useCallback, useEffect, useRef, useState, useReducer } from 'react'
import type { JournalDoc, Page } from '../types'
import { COVER_MS, FLIP_DUR_MS, STORAGE_KEY } from '../lib/constants'
import { nid } from '../lib/id'
import { makeSeed } from '../lib/seed'
import { usePaperSound } from './usePaperSound'
import { journalReducer, type JournalState } from './journalReducer'
import { loadJournal, login, logout, saveJournal, UnauthorizedError } from '../lib/api'

function init(): JournalState {
  let saved: Partial<JournalState> & { pages?: Page[] } = {}
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {} } catch { /* ignore */ }
  const seed = saved.pages ? { pages: saved.pages, sections: saved.sections! } : makeSeed()
  return {
    pages: seed.pages,
    sections: seed.sections,
    bookmark: typeof saved.bookmark === 'number' ? saved.bookmark : null,
    soundOn: saved.soundOn !== false,
    view: 'cover',
    coverRun: false,
    coverHalf: 'front',
    spread: 0,
    navSection: null,
    activePageId: null,
    activeBlockId: null,
    toolsOpen: null,
    flip: null,
    focusKey: null,
    fitScale: 1,
  }
}

const docOf = (st: JournalState): JournalDoc => ({
  pages: st.pages, sections: st.sections, bookmark: st.bookmark, soundOn: st.soundOn,
})

export function useJournal() {
  const [state, dispatch] = useReducer(journalReducer, undefined, init)

  // Always-current snapshot so stable callbacks can read latest state.
  const stateRef = useRef(state)
  stateRef.current = state

  // ---- server sync state ----
  // locked: true when we have no valid session and must prompt before syncing.
  const [locked, setLocked] = useState(false)
  // Guards server writes until the initial server load has resolved, so a fresh
  // device's cached/seed doc can't clobber the real server copy on mount.
  const readyRef = useRef(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const play = usePaperSound(state.soundOn)

  const tokRef = useRef(0)
  const coverTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const flipSafe = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ---- initial load from server (D1) ----
  // Boots instantly from the localStorage cache (init), then reconciles with the
  // server: hydrate when the server has a copy, or seed the server when it's empty.
  useEffect(() => {
    let cancelled = false
    async function boot() {
      // The httpOnly session cookie (if any) rides along automatically; a missing
      // or expired one surfaces as a 401 below and drops us to the lock screen.
      try {
        const { doc } = await loadJournal()
        if (cancelled) return
        if (doc) dispatch({ type: 'hydrate', doc })
        readyRef.current = true
        if (!doc) { try { await saveJournal(docOf(stateRef.current)) } catch { /* retried on next edit */ } }
      } catch (e) {
        if (cancelled) return
        if (e instanceof UnauthorizedError) { setLocked(true); return }
        // Network/server error: keep working from the local cache; edits will retry.
        readyRef.current = true
      }
    }
    boot()
    return () => { cancelled = true }
  }, [])

  // ---- persistence: localStorage cache (always) + debounced server save ----
  useEffect(() => {
    const doc = docOf(stateRef.current)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(doc)) } catch { /* ignore */ }

    if (!readyRef.current || locked) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveJournal(docOf(stateRef.current)).catch((e) => {
        if (e instanceof UnauthorizedError) setLocked(true)
        // other errors: cache still holds it; next edit retries
      })
    }, 800)
  }, [state.pages, state.sections, state.bookmark, state.soundOn, locked])

  // ---- unlock: exchange the password for a session cookie, load, start syncing ----
  const unlock = useCallback(async (pw: string): Promise<boolean> => {
    try {
      // Server verifies the password and sets an httpOnly cookie; the password
      // itself is never kept on the client.
      if (!(await login(pw))) return false // wrong password → stay locked
    } catch {
      // Couldn't reach the server to verify (offline): let the user in to work
      // from the local cache; the next online request re-checks the session.
      readyRef.current = true
      setLocked(false)
      return true
    }
    try {
      const { doc } = await loadJournal()
      if (doc) dispatch({ type: 'hydrate', doc })
      if (!doc) { try { await saveJournal(docOf(stateRef.current)) } catch { /* retried on next edit */ } }
    } catch (e) {
      if (e instanceof UnauthorizedError) return false
      // Non-auth error (offline after login): proceed from the local cache.
    }
    readyRef.current = true
    setLocked(false)
    return true
  }, [])

  // ---- lock: flush the latest edit, drop the session, return to the gate ----
  const lock = useCallback(() => {
    if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null }
    const wasReady = readyRef.current
    readyRef.current = false // block further saves until the next unlock
    setLocked(true)          // shows the LockScreen immediately
    // Flush any pending edit so the server copy is current, then clear the
    // httpOnly cookie server-side. Backgrounded so locking feels instant.
    void (async () => {
      if (wasReady) { try { await saveJournal(docOf(stateRef.current)) } catch { /* cache still holds it */ } }
      await logout()
    })()
  }, [])

  // ---- transient focus key: clear shortly after it's applied ----
  useEffect(() => {
    if (!state.focusKey) return
    const key = state.focusKey
    const t = setTimeout(() => dispatch({ type: 'clearFocusKey', key }), 90)
    return () => clearTimeout(t)
  }, [state.focusKey])

  // ---- responsive fit scaling ----
  useEffect(() => {
    const fit = () => {
      const W = window.innerWidth, H = window.innerHeight
      const s = Math.min((W - 56) / 1082, (H - 252) / 540, 1.2)
      const fs = Math.max(0.55, s * 0.963)
      if (Math.abs(fs - stateRef.current.fitScale) > 0.004) dispatch({ type: 'merge', patch: { fitScale: fs } })
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  // ---- close tools panel on outside pointer down ----
  useEffect(() => {
    const onDown = (e: Event) => {
      if (!stateRef.current.toolsOpen) return
      const panel = document.querySelector('[data-tools-panel]')
      if (panel && e.target instanceof Node && panel.contains(e.target)) return
      dispatch({ type: 'merge', patch: { toolsOpen: null } })
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [])

  // cleanup timers on unmount
  useEffect(() => () => {
    coverTimers.current.forEach(clearTimeout)
    if (flipSafe.current) clearTimeout(flipSafe.current)
    if (saveTimer.current) clearTimeout(saveTimer.current)
  }, [])

  // ---- navigation ----
  const canNext = useCallback(() => {
    const st = stateRef.current
    return st.pages.length > st.spread * 2 + 2
  }, [])
  const canPrev = useCallback(() => stateRef.current.spread > 0, [])

  const onFlipEnd = useCallback(() => dispatch({ type: 'flipEnd' }), [])

  const scheduleFlip = useCallback((dir: 'next' | 'prev', token: number) => {
    let tries = 0
    const start = () => {
      const st = stateRef.current
      if (!st.flip || st.flip.token !== token) return
      const node = document.querySelector('[data-flip-sheet]') as HTMLElement | null
      if (!node) { if (tries++ < 60) setTimeout(start, 16); return }
      if (node.dataset.flipTok === String(token)) return
      node.dataset.flipTok = String(token)
      const next = dir === 'next'
      const mid = next ? 'rotateY(-90deg)' : 'rotateY(90deg)'
      const end = next ? 'rotateY(-180deg)' : 'rotateY(180deg)'
      const shade = node.querySelector('[data-flip-shade]') as HTMLElement | null
      try {
        const anim = node.animate(
          [{ transform: 'rotateY(0deg)' }, { transform: mid, offset: 0.5 }, { transform: end }],
          { duration: FLIP_DUR_MS, easing: 'cubic-bezier(.42,0,.35,1)', fill: 'forwards' },
        )
        if (shade) shade.animate(
          [{ opacity: 0.05 }, { opacity: 0.5, offset: 0.5 }, { opacity: 0.05 }],
          { duration: FLIP_DUR_MS, easing: 'ease-in-out', fill: 'forwards' },
        )
        anim.onfinish = () => onFlipEnd()
      } catch { /* safety net covers it */ }
    }
    if (flipSafe.current) clearTimeout(flipSafe.current)
    flipSafe.current = setTimeout(() => {
      const st = stateRef.current
      if (st.flip && st.flip.token === token) onFlipEnd()
    }, FLIP_DUR_MS + 160)
    setTimeout(start, 0)
  }, [onFlipEnd])

  const jumpTo = useCallback((spread: number) => {
    const st = stateRef.current
    if (st.flip || st.view !== 'open' || spread === st.spread) return
    play('page')
    dispatch({ type: 'merge', patch: { spread } })
  }, [play])

  const clearCoverTimers = useCallback(() => {
    coverTimers.current.forEach(clearTimeout)
    coverTimers.current = []
  }, [])

  const onCloseBook = useCallback(() => {
    const st = stateRef.current
    if (st.view !== 'open' || st.flip) return
    play('cover')
    clearCoverTimers()
    dispatch({ type: 'merge', patch: { view: 'closing', coverRun: false, coverHalf: 'back', spread: 0 } })
    coverTimers.current.push(
      setTimeout(() => dispatch({ type: 'merge', patch: { coverRun: true } }), 30),
      setTimeout(() => dispatch({ type: 'mergeIfView', view: 'closing', patch: { coverHalf: 'front' } }), 30 + COVER_MS * 0.5),
      setTimeout(() => dispatch({ type: 'mergeIfView', view: 'closing', patch: { view: 'cover', coverRun: false, coverHalf: 'front' } }), 40 + COVER_MS),
    )
  }, [play, clearCoverTimers])

  const onNext = useCallback(() => {
    const st = stateRef.current
    if (st.view !== 'open' || st.flip || !canNext()) return
    play('page')
    const token = (tokRef.current += 1)
    dispatch({ type: 'merge', patch: { flip: { dir: 'next', token } } })
    scheduleFlip('next', token)
  }, [canNext, play, scheduleFlip])

  const onPrev = useCallback(() => {
    const st = stateRef.current
    if (st.view !== 'open' || st.flip) return
    if (!canPrev()) { onCloseBook(); return }
    play('page')
    const token = (tokRef.current += 1)
    dispatch({ type: 'merge', patch: { flip: { dir: 'prev', token } } })
    scheduleFlip('prev', token)
  }, [canPrev, play, scheduleFlip, onCloseBook])

  const goToPageNum = useCallback((n: number) => {
    const st = stateRef.current
    if (st.view !== 'open') return
    const total = st.pages.length
    n = Math.max(1, Math.min(total, n | 0))
    jumpTo(Math.floor((n - 1) / 2))
  }, [jumpTo])

  const onGoLast = useCallback(() => {
    const st = stateRef.current
    if (st.view !== 'open') return
    jumpTo(Math.floor((st.pages.length - 1) / 2))
  }, [jumpTo])

  const onPageKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const v = parseInt(e.currentTarget.value, 10)
      if (v) goToPageNum(v)
      e.currentTarget.value = ''
      e.currentTarget.blur()
    }
  }, [goToPageNum])

  const jumpToSection = useCallback((secId: string, spread: number) => {
    const st = stateRef.current
    if (st.view !== 'open' || st.flip) return
    dispatch({ type: 'merge', patch: { navSection: secId } })
    jumpTo(spread)
  }, [jumpTo])

  // ---- cover open ----
  const onOpen = useCallback(() => {
    const st = stateRef.current
    if (st.view !== 'cover') return
    play('cover')
    clearCoverTimers()
    dispatch({ type: 'merge', patch: { view: 'opening', coverRun: false, coverHalf: 'front' } })
    coverTimers.current.push(
      setTimeout(() => dispatch({ type: 'merge', patch: { coverRun: true } }), 30),
      setTimeout(() => dispatch({ type: 'mergeIfView', view: 'opening', patch: { coverHalf: 'back' } }), 30 + COVER_MS * 0.5),
      setTimeout(() => dispatch({ type: 'mergeIfView', view: 'opening', patch: { view: 'open', coverRun: false, coverHalf: 'back' } }), 40 + COVER_MS),
    )
  }, [play, clearCoverTimers])

  const onCoverClick = useCallback(() => {
    if (stateRef.current.view === 'cover') onOpen()
  }, [onOpen])

  // ---- add a page after the current spread, then flip to it ----
  const pendingNext = useRef(false)
  const onAddPage = useCallback(() => {
    const st = stateRef.current
    if (st.view !== 'open' || st.flip) return
    const s = st.spread
    const idx = s * 2 + 2
    const secId = st.pages[s * 2]?.sectionId ?? null
    const np: Page = { id: nid(), sectionId: secId, date: null, blocks: [] }
    const pages = st.pages.slice()
    pages.splice(Math.min(idx, pages.length), 0, np)
    pendingNext.current = true
    dispatch({ type: 'merge', patch: { pages } })
  }, [])

  // once the added page is committed, flip forward to reveal it
  useEffect(() => {
    if (pendingNext.current) {
      pendingNext.current = false
      onNext()
    }
  }, [state.pages, onNext])

  // ---- delete a specific page (by id, from its own on-page delete button) ----
  const deletePage = useCallback((pageId: string) => {
    const st = stateRef.current
    if (st.view !== 'open' || st.flip || st.pages.length <= 1) return
    const idx = st.pages.findIndex((p) => p.id === pageId)
    if (idx < 0) return
    const page = st.pages[idx]

    // Blank pages (the usual "oops, added too many") delete silently; pages with
    // real content ask first so a note isn't lost by accident.
    const blank = (page.blocks?.length ?? 0) === 0 && (page.stickers?.length ?? 0) === 0 && !page.date
    if (!blank && !window.confirm('Delete this page and everything on it?')) return

    const pages = st.pages.slice()
    pages.splice(idx, 1)
    const maxSpread = Math.max(0, Math.floor((pages.length - 1) / 2))
    const spread = Math.min(st.spread, maxSpread)
    const bookmark = st.bookmark !== null && st.bookmark > maxSpread ? null : st.bookmark
    play('page')
    dispatch({ type: 'merge', patch: { pages, spread, bookmark, activePageId: null, activeBlockId: null, focusKey: null } })
  }, [play])

  const onRibbon = useCallback(() => {
    const st = stateRef.current
    if (st.view !== 'open') return
    if (st.bookmark === st.spread) dispatch({ type: 'merge', patch: { bookmark: null } })
    else if (st.bookmark === null) dispatch({ type: 'merge', patch: { bookmark: st.spread } })
    else jumpTo(st.bookmark)
  }, [jumpTo])

  const onToggleSound = useCallback(() => dispatch({ type: 'toggleSound' }), [])
  const toggleTools = useCallback((which: 'sticker' | 'colors') => dispatch({ type: 'toggleToolsOpen', which }), [])
  const closeTools = useCallback(() => dispatch({ type: 'merge', patch: { toolsOpen: null } }), [])

  return {
    state,
    dispatch,
    locked,
    unlock,
    lock,
    canNext,
    onNext,
    onPrev,
    onGoLast,
    onPageKey,
    jumpToSection,
    onCoverClick,
    onAddPage,
    deletePage,
    onRibbon,
    onToggleSound,
    toggleTools,
    closeTools,
    onCloseBook,
  }
}
