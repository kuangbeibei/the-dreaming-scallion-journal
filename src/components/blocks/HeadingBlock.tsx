import type { Dispatch, HeadingBlock as HeadingBlockModel } from '../../types'

interface Props {
  block: HeadingBlockModel
  pageId: string
  ro: boolean
  dispatch: Dispatch
}

export default function HeadingBlock({ block, pageId, ro, dispatch }: Props) {
  const color = block.color || '#3a3730'
  return (
    <>
      <input
        value={block.text || ''}
        onChange={(e) => dispatch({ type: 'setHeading', pageId, blockId: block.id, value: e.target.value })}
        placeholder="Heading…"
        readOnly={ro}
        className="w-full border-none bg-transparent p-0 font-hand text-[38px] font-bold leading-[44px] outline-none"
        style={{ color }}
      />
      <div className="-mt-[2px] h-0 w-[62%] rounded-[2px] border-b-[2.5px] border-[rgba(111,148,85,0.5)]" />
    </>
  )
}
