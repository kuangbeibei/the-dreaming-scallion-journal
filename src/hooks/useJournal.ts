import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { Page } from '../types'
import { COVER_MS, FLIP_DUR_MS, PW, STORAGE_KEY } from '../lib/constants'
import { nid } from '../lib/id'
import { makeSeed } from '../lib/seed'
import { usePaperSound } from './usePaperSound'
import { journalReducer, type JournalState } from './journalReducer'

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

export function useJournal() {
  const [state, dispatch] = useReducer(journalReducer, undefined, init)

  // Always-current snapshot so stable callbacks can read latest state.
  const stateRef = useRef(state)
  stateRef.current = state

  const play = usePaperSound(state.soundOn)

  const tokRef = useRef(0)
  const coverTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const flipSafe = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ---- persistence ----
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        pages: state.pages, sections: state.sections, bookmark: state.bookmark, soundOn: state.soundOn,
      }))
    } catch { /* ignore */ }
  }, [state.pages, state.sections, state.bookmark, state.soundOn])

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
    canNext,
    onNext,
    onPrev,
    onGoLast,
    onPageKey,
    jumpToSection,
    onCoverClick,
    onAddPage,
    onRibbon,
    onToggleSound,
    toggleTools,
    closeTools,
    onCloseBook,
    PW,
  }
}
