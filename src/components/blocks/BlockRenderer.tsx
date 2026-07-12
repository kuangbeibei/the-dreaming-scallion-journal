import type { Block, Dispatch } from '../../types'
import HeadingBlock from './HeadingBlock'
import TextBlock from './TextBlock'
import DividerBlock from './DividerBlock'
import TodoBlock from './TodoBlock'
import NotesBlock from './NotesBlock'

interface Props {
  block: Block
  pageId: string
  ro: boolean
  focused: boolean
  dispatch: Dispatch
  focusKey?: string | null
  onSelectBlock: () => void
}

/** Renders a block's selection wrapper + remove affordance, delegating the inner
 *  content to the type-specific block component. */
export default function BlockRenderer({ block, pageId, ro, focused, dispatch, focusKey, onSelectBlock }: Props) {
  const canRemove = !ro && focused

  let inner = null
  switch (block.type) {
    case 'heading': inner = <HeadingBlock block={block} pageId={pageId} ro={ro} dispatch={dispatch} />; break
    case 'text': inner = <TextBlock block={block} pageId={pageId} ro={ro} dispatch={dispatch} />; break
    case 'divider': inner = <DividerBlock block={block} />; break
    case 'todo': inner = <TodoBlock block={block} pageId={pageId} ro={ro} focused={focused} dispatch={dispatch} focusKey={focusKey} />; break
    case 'notes': inner = <NotesBlock block={block} pageId={pageId} ro={ro} focused={focused} dispatch={dispatch} focusKey={focusKey} />; break
  }

  return (
    <div
      className={'relative mb-4 rounded-lg ' + (focused ? 'bg-[rgba(111,134,191,0.10)]' : 'bg-transparent')}
      onMouseDown={ro ? undefined : (e) => { e.stopPropagation(); onSelectBlock() }}
    >
      {canRemove && (
        <button
          onClick={() => dispatch({ type: 'removeBlock', pageId, blockId: block.id })}
          title="remove"
          className="absolute -top-[2px] -right-[26px] h-[22px] w-[22px] cursor-pointer border-none bg-transparent p-0 font-type text-[20px] leading-none text-[rgba(58,55,48,0.28)]"
        >
          ×
        </button>
      )}
      {inner}
    </div>
  )
}
