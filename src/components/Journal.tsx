import type { CSSProperties } from 'react'
import type { BlockType, Page, Side } from '../types'
import { BG_COLORS, GUT, INK_COLORS, PH, PW, STICKER_KINDS, TAB_PALETTE } from '../lib/constants'
import { useJournal } from '../hooks/useJournal'
import Background from './Background'
import JournalPage from './JournalPage'
import EndPage from './EndPage'
import FlipSheet from './FlipSheet'
import CoverLeaf from './CoverLeaf'
import SectionTabs, { type TabVM } from './SectionTabs'
import Ribbon from './Ribbon'
import ToolsPanel from './ToolsPanel'
import Toolbar from './Toolbar'
import LockScreen from './LockScreen'

const EASE = 'cubic-bezier(.42,.06,.2,1)'
const S = (PW + GUT) / 2

const ROOT_BG =
  'radial-gradient(120% 90% at 50% 4%, rgba(120,116,180,0.35), rgba(120,116,180,0) 55%), linear-gradient(165deg, #42406f 0%, #2f3560 38%, #232a52 68%, #171c39 100%)'

const faceBase: CSSProperties = {
  position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden', overflow: 'hidden', background: '#f4ecd6',
}

/** Top-level journal: computes all view-model geometry (a faithful port of the
 *  prototype's renderVals) and assembles the book, tools panel and toolbar. */
export default function Journal() {
  const j = useJournal()
  if (j.locked) return <LockScreen onUnlock={j.unlock} />
  const st = j.state
  const pages = st.pages
  const s = st.spread
  const P = (i: number): Page | null => (i >= 0 && i < pages.length ? pages[i] : null)

  let leftPage = P(2 * s), rightPage = P(2 * s + 1)
  let leftIdx = 2 * s, rightIdx = 2 * s + 1
  let flipping = false
  let dir: 'next' | 'prev' | null = null
  let sheetFront: Page | null = null, sheetBack: Page | null = null
  let sheetFrontFolio: number | null = null, sheetBackFolio: number | null = null
  let sheetFrontSide: Side = 'right', sheetBackSide: Side = 'left'
  if (st.flip) {
    flipping = true
    dir = st.flip.dir
    if (dir === 'next') {
      rightPage = P(2 * s + 3); rightIdx = 2 * s + 3
      sheetFront = P(2 * s + 1); sheetBack = P(2 * s + 2)
      sheetFrontFolio = sheetFront ? 2 * s + 2 : null; sheetFrontSide = 'right'
      sheetBackFolio = sheetBack ? 2 * s + 3 : null; sheetBackSide = 'left'
    } else {
      leftPage = P(2 * s - 2); leftIdx = 2 * s - 2
      sheetFront = P(2 * s); sheetBack = P(2 * s - 1)
      sheetFrontFolio = sheetFront ? 2 * s + 1 : null; sheetFrontSide = 'left'
      sheetBackFolio = sheetBack ? 2 * s : null; sheetBackSide = 'right'
    }
  }

  const view = st.view, cr = st.coverRun
  const coverPhase = view === 'cover' || view === 'opening' || view === 'closing'
  if (coverPhase) { rightPage = P(1); rightIdx = 1 }
  const isOpen = view === 'open'
  const fitScale = st.fitScale || 1

  const bookScaleStyle: CSSProperties = {
    transform: 'scale(' + fitScale + ')', transformOrigin: 'center top',
    marginBottom: Math.round(Math.max(0, 540 * (fitScale - 1)) + 8) + 'px',
  }
  const leftFolio = leftPage ? leftIdx + 1 : null
  const rightFolio = rightPage ? rightIdx + 1 : null
  const leftFaceStyle: CSSProperties = {
    position: 'absolute', top: 0, left: 0, width: 540, height: 540, overflow: 'hidden',
    borderRadius: '4px 1px 1px 4px', boxShadow: 'inset -24px 0 32px -22px rgba(30,34,70,0.5)',
    opacity: isOpen ? 1 : 0, transition: 'opacity 0.45s ease',
  }

  const sheetStyle: CSSProperties = {
    position: 'absolute', top: 0, width: PW, height: PH,
    left: dir === 'next' ? PW + GUT : 0,
    transformOrigin: dir === 'next' ? 'left center' : 'right center',
    transformStyle: 'preserve-3d', zIndex: 60, willChange: 'transform',
  }
  const faceFrontStyle: CSSProperties = {
    ...faceBase,
    borderRadius: dir === 'next' ? '1px 4px 4px 1px' : '4px 1px 1px 4px',
    boxShadow: '0 16px 38px rgba(20,24,60,0.34)',
  }
  const faceBackStyle: CSSProperties = {
    ...faceBase, transform: 'rotateY(180deg)',
    borderRadius: dir === 'next' ? '4px 1px 1px 4px' : '1px 4px 4px 1px',
    boxShadow: '0 16px 38px rgba(20,24,60,0.34)',
  }
  const frontShadeStyle: CSSProperties = {
    position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.05,
    background: dir === 'next'
      ? 'linear-gradient(90deg, rgba(24,28,60,0.9), rgba(24,28,60,0) 66%)'
      : 'linear-gradient(270deg, rgba(24,28,60,0.9), rgba(24,28,60,0) 66%)',
  }
  const backShadeStyle: CSSProperties = {
    position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.05,
    background: dir === 'next'
      ? 'linear-gradient(270deg, rgba(24,28,60,0.85), rgba(24,28,60,0) 66%)'
      : 'linear-gradient(90deg, rgba(24,28,60,0.85), rgba(24,28,60,0) 66%)',
  }

  // cover leaf (hinged at spine)
  let coverRot = 0
  if (view === 'opening') coverRot = cr ? -180 : 0
  else if (view === 'closing') coverRot = cr ? 0 : -180
  const coverAnimating = cr && (view === 'opening' || view === 'closing')
  const coverLeafStyle: CSSProperties = {
    position: 'absolute', top: 0, left: PW + GUT, width: PW, height: PH,
    transformOrigin: 'left center', transformStyle: 'preserve-3d',
    transform: 'rotateY(' + coverRot + 'deg)',
    transition: coverAnimating ? 'transform 0.95s ' + EASE : 'none',
    zIndex: 70, cursor: view === 'cover' ? 'pointer' : 'default', willChange: 'transform',
  }
  const coverFrontStyle: CSSProperties = {
    position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
    overflow: 'hidden', background: '#26305a', borderRadius: '2px 11px 11px 2px',
    boxShadow: '0 26px 60px -16px rgba(8,10,30,0.7)',
    opacity: st.coverHalf === 'front' ? 1 : 0, transition: 'opacity 0.06s linear',
  }
  const coverBackStyle: CSSProperties = {
    position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
    overflow: 'hidden', background: '#f4ecd6', transform: 'rotateY(180deg)', borderRadius: '11px 2px 2px 11px',
    boxShadow: '0 26px 60px -16px rgba(8,10,30,0.6)',
    opacity: st.coverHalf === 'back' ? 1 : 0, transition: 'opacity 0.06s linear',
  }
  const hintStyle: CSSProperties = {
    position: 'absolute', left: 0, right: 0, bottom: 18, textAlign: 'center',
    pointerEvents: 'none', opacity: view === 'cover' ? 1 : 0, transition: 'opacity 0.25s ease',
  }
  const coverP0 = P(0)
  const coverFolio = coverP0 ? 1 : null

  // shift wrapper (centre the closed cover; settle to centre when open)
  let shiftX = 0
  if (view === 'cover') shiftX = -S
  else if (view === 'opening') shiftX = cr ? 0 : -S
  else if (view === 'closing') shiftX = cr ? -S : 0
  const shiftStyle: CSSProperties = {
    position: 'relative', width: PW * 2 + GUT, height: PH,
    transform: 'translateX(' + shiftX + 'px)', transformStyle: 'preserve-3d',
    transition: coverAnimating ? 'transform 0.95s ' + EASE : 'none',
  }
  const spreadShadowStyle: CSSProperties = {
    position: 'absolute', top: 10, left: 6, right: 6, bottom: -6, borderRadius: 6,
    pointerEvents: 'none', zIndex: 0, boxShadow: '0 46px 90px -34px rgba(4,6,22,0.85)',
    opacity: isOpen ? 1 : 0, transition: 'opacity 0.5s ease',
  }

  // tabs
  const leftSec = P(2 * s)?.sectionId || null
  const rightSec = P(2 * s + 1)?.sectionId || null
  const curSecId = st.navSection && (leftSec === st.navSection || rightSec === st.navSection)
    ? st.navSection : (leftSec || rightSec)
  const tabs: TabVM[] = st.sections.map((sec, i) => {
    const idx = pages.findIndex((p) => p.sectionId === sec.id)
    const target = idx < 0 ? 0 : Math.floor(idx / 2)
    const active = sec.id === curSecId
    const style: CSSProperties = {
      position: 'absolute', right: active ? -40 : -34, top: 36 + i * 92,
      width: 40, height: 84, border: 'none', cursor: 'pointer',
      writingMode: 'vertical-rl', textOrientation: 'mixed',
      background: TAB_PALETTE[i % TAB_PALETTE.length], color: '#fbf6e7',
      font: "400 14px 'Special Elite','ZCOOL KuaiLe',monospace", letterSpacing: '1px',
      borderRadius: '0 8px 8px 0', padding: '10px 0',
      boxShadow: (active ? '0 6px 16px rgba(0,0,0,0.4)' : '0 4px 10px rgba(0,0,0,0.28)') + ', inset 0 0 0 1px rgba(255,255,255,0.12)',
      opacity: active ? 1 : 0.78, transition: 'right .18s ease, opacity .18s ease',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }
    return { key: sec.id, label: sec.title, onClick: () => j.jumpToSection(sec.id, target), style }
  })

  const ribbonStyle: CSSProperties = {
    position: 'absolute', top: -14, left: PW + GUT - 4, width: 22, height: 150,
    cursor: 'pointer', zIndex: 65, animation: 'jribbon 6s ease-in-out infinite',
    display: isOpen && st.bookmark === s ? 'block' : 'none',
  }

  const totalPages = pages.length
  const hi = 2 * s + 2 <= totalPages ? '–' + (2 * s + 2) : ''
  const pageLabel = isOpen ? 'Page ' + (2 * s + 1) + hi : 'The Dreaming Scallion'
  const showEndBack = isOpen && !rightPage
  const bookmarkMarked = st.bookmark === s
  const bookmarkLabel = st.bookmark === null ? 'mark' : bookmarkMarked ? 'unmark ✦' : 'go to ✦'
  const soundLabel = st.soundOn ? 'sound ◔' : 'muted ○'
  const closeLabel = isOpen ? 'close' : 'closed'

  const cornerBtn: CSSProperties = {
    position: 'absolute', bottom: 14, width: 40, height: 40, zIndex: 25, display: 'flex',
    alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
    background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(58,55,48,0.32)',
    transition: 'color .15s ease',
  }
  const chevStyle: CSSProperties = { font: "400 30px Caveat,'ZCOOL KuaiLe',cursive", color: 'inherit', lineHeight: 1, marginTop: -4 }

  // ---- content tools ----
  const lpid = leftPage?.id, rpid = rightPage?.id
  const activeId = st.activePageId === lpid || st.activePageId === rpid
    ? st.activePageId : (lpid || rpid || null)
  const activePage = pages.find((p) => p.id === activeId) || null
  const activeBg = activePage?.bg || '#F7F4EE'
  const activeBlk = activePage?.blocks.find((b) => b.id === st.activeBlockId) || null
  const curInk = activeBlk?.color || '#3a3730'
  const colors = [...BG_COLORS, ...INK_COLORS]
  const curColor = st.activeBlockId && activeBlk ? curInk : activeBg

  const onAddBlock = (bt: BlockType) => { if (activeId) j.dispatch({ type: 'addBlock', pageId: activeId, blockType: bt }) }
  const onPickSticker = (kind: string) => { if (activeId) j.dispatch({ type: 'addSticker', pageId: activeId, kind }); j.closeTools() }
  const onPickColor = (hex: string) => {
    if (!activeId) return
    if (st.activeBlockId) j.dispatch({ type: 'setBlockColor', pageId: activeId, blockId: st.activeBlockId, value: hex })
    else j.dispatch({ type: 'setPageBg', pageId: activeId, value: hex })
  }

  return (
    <div
      className="relative box-border flex h-full w-full flex-col items-center justify-center gap-6 overflow-hidden px-5 pb-10 pt-11 font-hand"
      style={{ background: ROOT_BG }}
    >
      <Background />

      <div style={bookScaleStyle}>
        <div style={{ position: 'relative', perspective: '2400px', perspectiveOrigin: '50% 42%' }}>
          <div style={shiftStyle}>
            <div style={spreadShadowStyle} />

            {/* left page */}
            <div style={leftFaceStyle}>
              {leftPage && (
                <JournalPage
                  page={leftPage} dispatch={j.dispatch} focusKey={st.focusKey}
                  activeBlockId={st.activeBlockId} folio={leftFolio} side="left"
                />
              )}
            </div>

            {/* right page */}
            <div
              style={{
                position: 'absolute', top: 0, left: 542, width: 540, height: 540, overflow: 'hidden',
                borderRadius: '1px 4px 4px 1px', boxShadow: 'inset 24px 0 32px -22px rgba(30,34,70,0.5)',
              }}
            >
              {rightPage && (
                <JournalPage
                  page={rightPage} dispatch={j.dispatch} focusKey={st.focusKey}
                  activeBlockId={st.activeBlockId} folio={rightFolio} side="right"
                />
              )}
              {showEndBack && <EndPage />}
            </div>

            {/* center spine shadow */}
            <div
              style={{
                position: 'absolute', top: 0, left: 529, width: 26, height: 540, pointerEvents: 'none',
                background: 'linear-gradient(90deg, rgba(24,28,60,0), rgba(24,28,60,0.3) 46%, rgba(24,28,60,0.3) 54%, rgba(24,28,60,0) )',
              }}
            />

            {/* page-turn corners */}
            {isOpen && (
              <>
                <div onClick={j.onPrev} title="previous page" style={{ ...cornerBtn, left: 14 }}>
                  <span style={chevStyle}>‹</span>
                </div>
                <div
                  onClick={j.onNext} title="next page"
                  style={{ ...cornerBtn, right: 14, display: j.canNext() ? 'flex' : 'none' }}
                >
                  <span style={chevStyle}>›</span>
                </div>
              </>
            )}

            {/* flip sheet */}
            {flipping && (
              <FlipSheet
                sheetStyle={sheetStyle} faceFrontStyle={faceFrontStyle} faceBackStyle={faceBackStyle}
                frontShadeStyle={frontShadeStyle} backShadeStyle={backShadeStyle}
                front={sheetFront} back={sheetBack}
                frontFolio={sheetFrontFolio} backFolio={sheetBackFolio}
                frontSide={sheetFrontSide} backSide={sheetBackSide}
              />
            )}

            {/* cover leaf */}
            {coverPhase && (
              <CoverLeaf
                leafStyle={coverLeafStyle} frontStyle={coverFrontStyle} backStyle={coverBackStyle}
                hintStyle={hintStyle} coverPage={coverP0} coverFolio={coverFolio} onClick={j.onCoverClick}
              />
            )}

            {/* section tabs */}
            {isOpen && <SectionTabs tabs={tabs} />}

            {/* ribbon bookmark */}
            <Ribbon style={ribbonStyle} onClick={j.onRibbon} />
          </div>
        </div>
      </div>

      {/* content tools slot */}
      <div className="flex min-h-[50px] items-center justify-center">
        {isOpen && (
          <ToolsPanel
            toolsOpen={st.toolsOpen}
            stickerKinds={STICKER_KINDS}
            colors={colors}
            currentColor={curColor}
            onAddBlock={onAddBlock}
            onPickSticker={onPickSticker}
            onPickColor={onPickColor}
            onToggleStickers={() => j.toggleTools('sticker')}
            onToggleColors={() => j.toggleTools('colors')}
            onCloseTools={j.closeTools}
          />
        )}
      </div>

      <Toolbar
        pageLabel={pageLabel} totalPages={totalPages}
        bookmarkLabel={bookmarkLabel} bookmarkMarked={bookmarkMarked}
        soundLabel={soundLabel} closeLabel={closeLabel}
        onPrev={j.onPrev} onNext={j.onNext} onAddPage={j.onAddPage} onGoLast={j.onGoLast}
        onRibbon={j.onRibbon} onToggleSound={j.onToggleSound} onCloseBook={j.onCloseBook}
        onLock={j.lock} onPageKey={j.onPageKey}
      />
    </div>
  )
}
