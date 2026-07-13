import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { Dispatch, Page, Side } from '../types'
import { hexToRgba } from '../lib/color'
import BlockRenderer from './blocks/BlockRenderer'
import Sticker from './Sticker'

interface Props {
  page: Page | null
  readonly?: boolean
  dispatch?: Dispatch
  focusKey?: string | null
  activeBlockId?: string | null
  folio?: number | null
  side?: Side
  onDeletePage?: (pageId: string) => void
}

const noop: Dispatch = () => {}

/** A single journal page: date header, block stack, sticker layer, folio number. */
export default function JournalPage({ page = null, readonly, dispatch, focusKey, activeBlockId, folio, side, onDeletePage }: Props) {
  const ro = !!readonly
  const d = ro ? noop : (dispatch || noop)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const ink = page?.ink || '#3a3730'
  const folioSide = side === 'left' ? 'left' : 'right'
  const hasFolio = folio != null && (folio as unknown as string) !== '' && !!page
  const folioStyle: CSSProperties = {
    position: 'absolute', bottom: '12px', left: '50%',
    color: hexToRgba(ink, 0.4), pointerEvents: 'none', zIndex: 5,
    transform: 'translateX(-50%) rotate(' + (folioSide === 'left' ? -2 : 2) + 'deg)',
  }

  const bg = page?.bg || '#F7F4EE'

  if (!page) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-page">
        <div className="pointer-events-none absolute inset-0 bg-page" />
      </div>
    )
  }

  const pid = page.id
  const onBgDown = ro ? undefined : () => {
    if (selectedId) setSelectedId(null)
    d({ type: 'focusBlock', pageId: pid, blockId: null })
  }

  return (
    <div className="group relative h-full w-full overflow-hidden bg-page" onMouseDown={onBgDown}>
      <div className="pointer-events-none absolute inset-0" style={{ background: bg }} />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.4), rgba(96,108,150,0.05) 58%, rgba(70,84,130,0.13))',
          mixBlendMode: 'multiply',
        }}
      />

      {(page.decorations || []).map((deco, i) => (
        <div key={i} style={deco.style} />
      ))}

      <div className="relative box-border h-full overflow-auto px-[42px] pb-[46px] pt-[30px]">
        {page.date != null || !ro ? (
          <div className="mb-[6px] flex justify-end overflow-visible">
            <input
              value={page.date || ''}
              onChange={(e) => d({ type: 'setDate', pageId: pid, value: e.target.value })}
              placeholder="date…"
              readOnly={ro}
              className="box-border h-[44px] w-[340px] border-none bg-transparent text-right font-hand text-[27px] font-medium leading-[1.35] text-[#6f86bf] outline-none"
              style={{ transform: 'rotate(-1.6deg)', transformOrigin: 'right center', padding: '2px 14px 6px 2px' }}
            />
          </div>
        ) : (
          /* read-only page with no date: reserve the field's footprint so the
             page content doesn't shift up when it turns onto the flip sheet */
          <div className="mb-[6px] h-[44px]" aria-hidden />
        )}

        {(page.blocks || []).map((b) => (
          <BlockRenderer
            key={b.id}
            block={b}
            pageId={pid}
            ro={ro}
            focused={!ro && activeBlockId === b.id}
            dispatch={d}
            focusKey={focusKey}
            onSelectBlock={() => {
              if (selectedId) setSelectedId(null)
              d({ type: 'focusBlock', pageId: pid, blockId: b.id })
            }}
          />
        ))}

        {(page.stickers || []).map((s) => (
          <Sticker
            key={s.id}
            sticker={s}
            pageId={pid}
            ro={ro}
            dispatch={d}
            selected={!ro && selectedId === s.id}
            onSelect={setSelectedId}
          />
        ))}
      </div>

      {hasFolio && (
        <div className="font-hand text-[23px] font-medium" style={folioStyle}>
          {String(folio)}
        </div>
      )}

      {!ro && onDeletePage && (
        <button
          onClick={(e) => { e.stopPropagation(); onDeletePage(pid) }}
          title="delete this page"
          aria-label="delete this page"
          className="absolute left-[14px] top-[14px] z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full text-[15px] leading-none text-[rgba(58,55,48,0.45)] opacity-0 transition-opacity duration-150 hover:bg-[rgba(180,85,63,0.12)] hover:text-[rgba(180,85,63,0.95)] focus:opacity-100 group-hover:opacity-100"
        >
          🗑
        </button>
      )}
    </div>
  )
}
