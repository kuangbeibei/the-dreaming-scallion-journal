interface Props {
  pageLabel: string
  totalPages: number
  bookmarkLabel: string
  bookmarkMarked: boolean
  soundLabel: string
  closeLabel: string
  onPrev: () => void
  onNext: () => void
  onAddPage: () => void
  onGoLast: () => void
  onRibbon: () => void
  onToggleSound: () => void
  onCloseBook: () => void
  onLock: () => void
  onPageKey: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

const NAV =
  'h-[38px] w-[38px] cursor-pointer rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.08)] font-hand text-[22px] font-semibold leading-none text-cream shadow-[inset_0_1px_1px_rgba(255,255,255,0.10)]'
const BTN =
  'h-[34px] cursor-pointer rounded-[18px] border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.07)] px-[14px] font-type text-[14px] tracking-[0.5px] text-cream'
const BTN_MARKED =
  'h-[34px] cursor-pointer rounded-[18px] border border-[rgba(230,205,130,0.6)] bg-[rgba(183,143,56,0.34)] px-[14px] font-type text-[14px] tracking-[0.5px] text-[#f6ecca]'
const DIV = 'mx-1 h-[26px] w-px bg-[rgba(255,255,255,0.16)]'

/** Bottom navigation bar: page turns, go-to, add/bookmark/sound/close. */
export default function Toolbar({
  pageLabel, totalPages, bookmarkLabel, bookmarkMarked, soundLabel, closeLabel,
  onPrev, onNext, onAddPage, onGoLast, onRibbon, onToggleSound, onCloseBook, onLock, onPageKey,
}: Props) {
  return (
    <div className="flex items-center gap-[10px] rounded-[40px] bg-gradient-to-b from-navy-panel to-navy-deep px-[14px] py-[9px] shadow-[0_12px_26px_-12px_rgba(8,10,30,0.6),inset_0_1px_1px_rgba(255,255,255,0.08)]">
      <button onClick={onPrev} className={NAV}>‹</button>
      <div className="flex min-w-[150px] items-center justify-center gap-[5px] whitespace-nowrap font-type text-[15px] tracking-[1px] text-cream">
        <span>{pageLabel}</span>
        <span className="opacity-55">/ {totalPages}</span>
      </div>
      <button onClick={onNext} className={NAV}>›</button>
      <div className={DIV} />
      <input placeholder="go #" onKeyDown={onPageKey} className="box-border h-[30px] w-[52px] rounded-[15px] border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.07)] px-[6px] text-center font-type text-[14px] text-cream outline-none" />
      <button onClick={onGoLast} title="jump to last page" className={BTN}>last »</button>
      <div className={DIV} />
      <button onClick={onAddPage} className={BTN}>+ page</button>
      <button onClick={onRibbon} className={bookmarkMarked ? BTN_MARKED : BTN}>{bookmarkLabel}</button>
      <button onClick={onToggleSound} className={BTN}>{soundLabel}</button>
      <button onClick={onCloseBook} className={BTN}>{closeLabel}</button>
      <div className={DIV} />
      <button onClick={onLock} title="lock the journal" className={BTN}>lock ⌂</button>
    </div>
  )
}
