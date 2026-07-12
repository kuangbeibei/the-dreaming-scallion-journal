import { hexEq } from '../lib/color'

interface Props {
  colors: string[]
  current: string
  onPick: (hex: string) => void
  onDone: () => void
}

/** Popover for tinting the active line (or the page background). */
export default function ColorsPicker({ colors, current, onPick, onDone }: Props) {
  return (
    <div className="absolute bottom-[calc(100%+12px)] left-1/2 z-[120] w-[362px] -translate-x-1/2 rounded-[16px] bg-paper px-4 pb-4 pt-[14px] shadow-[0_18px_40px_-14px_rgba(8,10,30,0.7)]">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-hand text-[22px] font-semibold text-[#5b5648]">Colors</span>
        <button onClick={onDone} className="cursor-pointer border-none bg-transparent font-type text-[13px] text-[#8a8676]">Done</button>
      </div>
      <div className="mb-2 mt-[2px] font-hand text-[16px] font-medium text-[#8a8676]">Tap a line to color it — otherwise sets the page</div>
      <div className="flex flex-wrap gap-[9px]">
        {colors.map((hex) => (
          <button
            key={hex}
            onClick={() => onPick(hex)}
            title={hex}
            className="h-[30px] w-[30px] cursor-pointer rounded-full p-0 shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
            style={{ background: hex, border: hexEq(hex, current) ? '3px solid #26305a' : '2px solid rgba(0,0,0,0.15)' }}
          />
        ))}
      </div>
    </div>
  )
}
