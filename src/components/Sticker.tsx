import type { CSSProperties } from 'react'
import type { Dispatch, Sticker as StickerModel } from '../types'
import { STICKER_ASPECT } from '../lib/constants'

interface Props {
  sticker: StickerModel
  pageId: string
  ro: boolean
  dispatch: Dispatch
  selected: boolean
  onSelect: (id: string | null) => void
}

type DomEvt = MouseEvent | TouchEvent
const point = (e: DomEvt | React.MouseEvent | React.TouchEvent) =>
  ('touches' in e && e.touches[0]) ? e.touches[0] : (e as MouseEvent)

// live element scale (parent's rendered width / layout width), for accurate drags
const scaleOf = (el: HTMLElement | null): number => {
  const par = el && el.parentElement
  return par && par.offsetWidth ? par.getBoundingClientRect().width / par.offsetWidth : 1
}

interface DragEl extends HTMLElement { __nx?: number; __ny?: number; __ns?: number }

export default function Sticker({ sticker: s, pageId, ro, dispatch, selected, onSelect }: Props) {
  const size = s.size || 108
  const asp = STICKER_ASPECT[s.kind] || 1

  const wrapStyle: CSSProperties = {
    position: 'absolute', left: (s.x || 0) + 'px', top: (s.y || 0) + 'px',
    width: size + 'px', height: Math.round(size * asp) + 'px',
    transform: 'rotate(' + (s.rot || 0) + 'deg)', transformOrigin: 'center',
    zIndex: selected ? 55 : 40,
    cursor: ro ? 'default' : 'grab', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none',
    pointerEvents: ro ? 'none' : 'auto',
  }

  const onDown = ro ? undefined : (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    if (!selected) onSelect(s.id)
    const el = e.currentTarget as DragEl
    const scale = scaleOf(el) || 1
    const pt = point(e)
    const sx = pt.clientX, sy = pt.clientY, ox = s.x || 0, oy = s.y || 0
    el.style.cursor = 'grabbing'
    const move = (ev: DomEvt) => {
      const p = point(ev)
      let nx = ox + (p.clientX - sx) / scale
      let ny = oy + (p.clientY - sy) / scale
      nx = Math.max(-14, Math.min(520, nx)); ny = Math.max(-14, Math.min(520, ny))
      el.style.left = nx + 'px'; el.style.top = ny + 'px'; el.__nx = nx; el.__ny = ny
      if (ev.cancelable) ev.preventDefault()
    }
    const up = () => {
      window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up)
      window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up)
      if (el.__nx != null && el.__ny != null) dispatch({ type: 'moveSticker', pageId, stickerId: s.id, x: el.__nx, y: el.__ny })
    }
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
    window.addEventListener('touchmove', move, { passive: false }); window.addEventListener('touchend', up)
  }

  const onResizeDown = ro ? undefined : (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    const wrap = (e.currentTarget as HTMLElement).parentElement as DragEl
    const scale = scaleOf(wrap) || 1
    const pt = point(e)
    const sx = pt.clientX, sy = pt.clientY, osz = size
    const move = (ev: DomEvt) => {
      const p = point(ev)
      const dd = ((p.clientX - sx) + (p.clientY - sy)) / 2 / scale
      const ns = Math.max(46, Math.min(320, osz + dd))
      wrap.style.width = ns + 'px'; wrap.style.height = Math.round(ns * asp) + 'px'; wrap.__ns = ns
      if (ev.cancelable) ev.preventDefault()
    }
    const up = () => {
      window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up)
      window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up)
      if (wrap.__ns != null) dispatch({ type: 'resizeSticker', pageId, stickerId: s.id, size: Math.round(wrap.__ns) })
    }
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
    window.addEventListener('touchmove', move, { passive: false }); window.addEventListener('touchend', up)
  }

  const stopDown = (e: React.MouseEvent | React.TouchEvent) => e.stopPropagation()

  return (
    <div style={wrapStyle} onMouseDown={onDown} onTouchStart={onDown}>
      <img
        src={'assets/stickers/' + s.kind + '.png'}
        draggable={false}
        className="block h-full w-full select-none object-contain"
        style={{ pointerEvents: 'none', WebkitUserDrag: 'none' } as CSSProperties}
        alt={s.kind}
      />
      {!ro && selected && (
        <>
          <div className="pointer-events-none absolute -inset-[7px] rounded-[12px] border-2 border-dashed border-[rgba(111,134,191,0.85)]" />
          <button
            onClick={() => { dispatch({ type: 'removeSticker', pageId, stickerId: s.id }); onSelect(null) }}
            onMouseDown={stopDown}
            onTouchStart={stopDown}
            title="remove"
            className="absolute -top-[11px] -right-[11px] z-[3] h-[22px] w-[22px] cursor-pointer rounded-full border-none bg-[rgba(58,55,48,0.72)] p-0 text-center font-type text-[15px] leading-[22px] text-white shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
          >
            ×
          </button>
          <div
            onMouseDown={onResizeDown}
            onTouchStart={onResizeDown}
            title="drag to resize"
            className="absolute -bottom-[10px] -right-[10px] z-[3] h-[18px] w-[18px] cursor-nwse-resize rounded-full border-2 border-[#6f86bf] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
            style={{ touchAction: 'none' }}
          />
        </>
      )}
    </div>
  )
}
