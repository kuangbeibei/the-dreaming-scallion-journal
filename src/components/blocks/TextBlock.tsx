import type { CSSProperties } from 'react'
import type { Dispatch, TextBlock as TextBlockModel } from '../../types'

interface Props {
  block: TextBlockModel
  pageId: string
  ro: boolean
  dispatch: Dispatch
}

export default function TextBlock({ block, pageId, ro, dispatch }: Props) {
  const color = block.color || '#3a3730'
  // fieldSizing keeps the textarea auto-growing; not yet in the CSS types.
  const style = { color, fieldSizing: 'content' } as CSSProperties
  return (
    <textarea
      value={block.body || ''}
      onChange={(e) => dispatch({ type: 'setText', pageId, blockId: block.id, value: e.target.value })}
      placeholder="Write freely…"
      readOnly={ro}
      className="block w-full resize-none overflow-hidden border-none bg-transparent p-0 font-hand text-[25px] leading-[33px] outline-none min-h-[33px]"
      style={style}
    />
  )
}
