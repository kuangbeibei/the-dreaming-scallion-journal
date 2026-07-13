import { useState } from 'react'
import type { Dispatch, TodoBlock as TodoBlockModel } from '../../types'
import { hexToRgba } from '../../lib/color'
import { focusRef } from './focusRef'

/** Copy the whole list to the clipboard as a markdown task list. */
async function copyItems(items: { text: string; done: boolean }[]): Promise<boolean> {
  const text = items
    .filter((it) => (it.text || '').trim() !== '')
    .map((it) => `- [${it.done ? 'x' : ' '}] ${it.text}`)
    .join('\n')
  if (!text) return false
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for browsers/contexts without the async clipboard API.
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch { return false }
  }
}

interface Props {
  block: TodoBlockModel
  pageId: string
  ro: boolean
  focused: boolean
  dispatch: Dispatch
  focusKey?: string | null
}

export default function TodoBlock({ block, pageId, ro, focused, dispatch, focusKey }: Props) {
  const bc = block.color || '#3a3730'
  const bcSoft = hexToRgba(bc, 0.5)
  const [copied, setCopied] = useState(false)
  const hasItems = (block.items || []).some((it) => (it.text || '').trim() !== '')

  const onCopyAll = async () => {
    if (await copyItems(block.items || [])) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    }
  }
  return (
    <>
      {(block.items || []).map((it, i) => {
        const key = block.id + ':' + i
        return (
          <div key={key} className="flex min-h-[34px] items-start gap-[11px]">
            <button
              onClick={() => dispatch({ type: 'toggleTodo', pageId, blockId: block.id, index: i })}
              className="mt-1 flex h-6 w-6 flex-[0_0_24px] items-center justify-center p-0 font-hand text-[20px] font-bold leading-5"
              style={{
                cursor: ro ? 'default' : 'pointer',
                border: '2px solid ' + (it.done ? '#5a7d5a' : bcSoft),
                borderRadius: '7px 9px 6px 8px',
                background: it.done ? 'rgba(120,150,110,0.2)' : 'transparent',
                color: '#4a6b45',
              }}
            >
              {it.done ? '✓' : ''}
            </button>
            <input
              value={it.text || ''}
              onChange={(e) => dispatch({ type: 'setTodoText', pageId, blockId: block.id, index: i, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); dispatch({ type: 'addTodo', pageId, blockId: block.id, after: i }) }
                else if (e.key === 'Backspace' && !e.currentTarget.value) { e.preventDefault(); dispatch({ type: 'removeTodoItem', pageId, blockId: block.id, index: i }) }
              }}
              ref={focusRef(focusKey, key)}
              placeholder="to-do…"
              readOnly={ro}
              className="flex-1 border-none bg-transparent px-0 py-[1px] font-hand text-[25px] leading-[33px] outline-none"
              style={{
                color: it.done ? bcSoft : bc,
                textDecoration: it.done ? 'line-through' : 'none',
                textDecorationColor: 'rgba(95,110,166,0.65)',
              }}
            />
          </div>
        )
      })}
      {!ro && (focused || hasItems) && (
        <div className="ml-[35px] mt-[2px] flex items-center gap-4">
          {focused && (
            <button
              onClick={() => dispatch({ type: 'addTodo', pageId, blockId: block.id })}
              className="border-none bg-transparent py-[2px] font-hand text-[20px] text-[rgba(58,55,48,0.4)]"
            >
              + add item
            </button>
          )}
          {hasItems && (
            <button
              onClick={onCopyAll}
              title="copy the whole list"
              className="border-none bg-transparent py-[2px] font-hand text-[18px] text-[rgba(58,55,48,0.4)]"
            >
              {copied ? '✓ copied' : '⧉ copy all'}
            </button>
          )}
        </div>
      )}
    </>
  )
}
