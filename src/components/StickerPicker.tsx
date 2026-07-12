interface Props {
  kinds: readonly string[]
  onPick: (kind: string) => void
  onDone: () => void
}

/** Popover grid for adding a sticker to the active page. */
export default function StickerPicker({ kinds, onPick, onDone }: Props) {
  return (
    <div className="absolute bottom-[calc(100%+12px)] left-1/2 z-[120] w-[362px] -translate-x-1/2 rounded-[16px] bg-paper px-4 pb-4 pt-[14px] shadow-[0_18px_40px_-14px_rgba(8,10,30,0.7)]">
      <div className="mb-[10px] flex items-center justify-between">
        <span className="font-hand text-[22px] font-semibold text-[#5b5648]">Add a sticker</span>
        <button onClick={onDone} className="cursor-pointer border-none bg-transparent font-type text-[13px] text-[#8a8676]">Done</button>
      </div>
      <div className="grid max-h-[296px] grid-cols-4 gap-[9px] overflow-auto">
        {kinds.map((kind) => (
          <button
            key={kind}
            onClick={() => onPick(kind)}
            title={kind}
            className="flex aspect-square items-center justify-center rounded-[14px] border-[1.5px] border-[rgba(58,55,48,0.12)] bg-[rgba(255,255,255,0.6)] p-[7px]"
          >
            <img src={'assets/stickers/' + kind + '.png'} draggable={false} alt={kind} className="pointer-events-none block max-h-full max-w-full object-contain" />
          </button>
        ))}
      </div>
    </div>
  )
}
