import type { Dispatch, NotesBlock as NotesBlockModel } from '../../types'
import { focusRef } from './focusRef'

interface Props {
  block: NotesBlockModel
  pageId: string
  ro: boolean
  focused: boolean
  dispatch: Dispatch
  focusKey?: string | null
}

export default function NotesBlock({ block, pageId, ro, focused, dispatch, focusKey }: Props) {
  const bc = block.color || '#3a3730'
  return (
    <>
      {(block.items || []).map((it, i) => {
        const key = block.id + ':' + i
        const text = (typeof it === 'string' ? it : it.text) || ''
        return (
          <div key={key} className="flex min-h-[34px] items-start gap-[11px]">
            <span className="pt-px font-hand text-[27px] leading-[33px] text-[#6f9455]">–</span>
            <input
              value={text}
              onChange={(e) => dispatch({ type: 'setNoteText', pageId, blockId: block.id, index: i, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); dispatch({ type: 'addNote', pageId, blockId: block.id, after: i }) }
                else if (e.key === 'Backspace' && !e.currentTarget.value) { e.preventDefault(); dispatch({ type: 'removeNoteItem', pageId, blockId: block.id, index: i }) }
              }}
              ref={focusRef(focusKey, key)}
              placeholder="note…"
              readOnly={ro}
              className="flex-1 border-none bg-transparent px-0 py-[1px] font-hand text-[25px] leading-[33px] outline-none"
              style={{ color: bc }}
            />
          </div>
        )
      })}
      {!ro && focused && (
        <button
          onClick={() => dispatch({ type: 'addNote', pageId, blockId: block.id })}
          className="ml-[26px] mt-[2px] border-none bg-transparent py-[2px] font-hand text-[20px] text-[rgba(58,55,48,0.4)]"
        >
          + add line
        </button>
      )}
    </>
  )
}
