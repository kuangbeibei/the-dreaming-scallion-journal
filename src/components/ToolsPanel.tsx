import type { BlockType } from '../types'
import type { ToolsOpen } from '../hooks/journalReducer'
import StickerPicker from './StickerPicker'
import ColorsPicker from './ColorsPicker'

interface Props {
  toolsOpen: ToolsOpen
  stickerKinds: readonly string[]
  colors: string[]
  currentColor: string
  onAddBlock: (type: BlockType) => void
  onPickSticker: (kind: string) => void
  onPickColor: (hex: string) => void
  onToggleStickers: () => void
  onToggleColors: () => void
  onCloseTools: () => void
}

const CHIP =
  'h-[32px] cursor-pointer whitespace-nowrap rounded-[16px] border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.07)] px-3 font-hand text-[17px] text-cream'
const CHIP_ACTIVE =
  'h-[32px] cursor-pointer whitespace-nowrap rounded-[16px] border border-[rgba(230,205,130,0.55)] bg-[rgba(230,205,130,0.28)] px-3 font-hand text-[17px] text-[#f6ecca]'

/** Content-authoring bar: add blocks, open the sticker / color pickers. */
export default function ToolsPanel({
  toolsOpen, stickerKinds, colors, currentColor,
  onAddBlock, onPickSticker, onPickColor, onToggleStickers, onToggleColors, onCloseTools,
}: Props) {
  return (
    <div data-tools-panel="1" className="relative flex justify-center">
      {toolsOpen === 'sticker' && (
        <StickerPicker kinds={stickerKinds} onPick={onPickSticker} onDone={onCloseTools} />
      )}
      {toolsOpen === 'colors' && (
        <ColorsPicker colors={colors} current={currentColor} onPick={onPickColor} onDone={onCloseTools} />
      )}
      <div className="flex items-center gap-2 rounded-[40px] bg-gradient-to-b from-navy-panel to-navy-deep px-3 py-2 shadow-[0_12px_26px_-12px_rgba(8,10,30,0.6),inset_0_1px_1px_rgba(255,255,255,0.08)]">
        <button onClick={() => onAddBlock('todo')} className={CHIP}>✓ To-do</button>
        <button onClick={() => onAddBlock('notes')} className={CHIP}>– List</button>
        <button onClick={() => onAddBlock('heading')} className={CHIP}>H Heading</button>
        <button onClick={() => onAddBlock('text')} className={CHIP}>¶ Text</button>
        <button onClick={() => onAddBlock('divider')} className={CHIP}>✦ Divider</button>
        <div className="h-[22px] w-px bg-[rgba(255,255,255,0.16)]" />
        <button onClick={onToggleStickers} className={toolsOpen === 'sticker' ? CHIP_ACTIVE : CHIP}>☺ Sticker</button>
        <button onClick={onToggleColors} className={toolsOpen === 'colors' ? CHIP_ACTIVE : CHIP}>◐ Colors</button>
      </div>
    </div>
  )
}
