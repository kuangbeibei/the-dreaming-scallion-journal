import type { Block, DocAction, Page, Section } from '../types'
import { BIG_STICKERS } from '../lib/constants'
import { nid } from '../lib/id'

export type View = 'cover' | 'opening' | 'open' | 'closing'
export type CoverHalf = 'front' | 'back'
export type ToolsOpen = 'sticker' | 'colors' | null

export interface Flip {
  dir: 'next' | 'prev'
  token: number
}

export interface JournalState {
  // persisted
  pages: Page[]
  sections: Section[]
  bookmark: number | null
  soundOn: boolean
  // ephemeral / view
  view: View
  coverRun: boolean
  coverHalf: CoverHalf
  spread: number
  navSection: string | null
  activePageId: string | null
  activeBlockId: string | null
  toolsOpen: ToolsOpen
  flip: Flip | null
  focusKey: string | null
  fitScale: number
}

export type JournalAction =
  | DocAction
  | { type: 'merge'; patch: Partial<JournalState> }
  | { type: 'mergeIfView'; view: View; patch: Partial<JournalState> }
  | { type: 'flipEnd' }
  | { type: 'toggleSound' }
  | { type: 'toggleToolsOpen'; which: 'sticker' | 'colors' }
  | { type: 'clearFocusKey'; key: string }

// ---- immutable helpers ----
const mapPage = (pages: Page[], pageId: string, fn: (p: Page) => Page): Page[] =>
  pages.map((p) => (p.id === pageId ? fn({ ...p }) : p))

const mapBlock = (page: Page, blockId: string, fn: (b: Block) => Block): Page => ({
  ...page,
  blocks: (page.blocks || []).map((bl) => (bl.id === blockId ? fn({ ...bl }) : bl)),
})

function newBlock(type: string): Block {
  const id = nid()
  if (type === 'heading') return { id, type: 'heading', text: '' }
  if (type === 'divider') return { id, type: 'divider' }
  if (type === 'todo') return { id, type: 'todo', items: [{ text: '', done: false }] }
  if (type === 'notes') return { id, type: 'notes', items: [{ text: '' }] }
  return { id, type: 'text', body: '' }
}

function docReducer(state: JournalState, a: DocAction): JournalState {
  const setPages = (pages: Page[], focusKey?: string | null): JournalState =>
    focusKey !== undefined ? { ...state, pages, focusKey } : { ...state, pages }

  switch (a.type) {
    case 'focusBlock':
      return { ...state, activePageId: a.pageId, activeBlockId: a.blockId }

    case 'setHeading':
      return setPages(mapPage(state.pages, a.pageId, (p) =>
        mapBlock(p, a.blockId, (b) => (b.type === 'heading' ? { ...b, text: a.value } : b))))

    case 'setText':
      return setPages(mapPage(state.pages, a.pageId, (p) =>
        mapBlock(p, a.blockId, (b) => (b.type === 'text' ? { ...b, body: a.value } : b))))

    case 'setDate':
      return setPages(mapPage(state.pages, a.pageId, (p) => ({ ...p, date: a.value })))

    case 'toggleTodo':
      return setPages(mapPage(state.pages, a.pageId, (p) =>
        mapBlock(p, a.blockId, (b) => {
          if (b.type !== 'todo') return b
          const items = b.items.slice()
          items[a.index] = { ...items[a.index], done: !items[a.index].done }
          return { ...b, items }
        })))

    case 'setTodoText':
      return setPages(mapPage(state.pages, a.pageId, (p) =>
        mapBlock(p, a.blockId, (b) => {
          if (b.type !== 'todo') return b
          const items = b.items.slice()
          items[a.index] = { ...items[a.index], text: a.value }
          return { ...b, items }
        })))

    case 'setNoteText':
      return setPages(mapPage(state.pages, a.pageId, (p) =>
        mapBlock(p, a.blockId, (b) => {
          if (b.type !== 'notes') return b
          const items = b.items.slice()
          items[a.index] = { text: a.value }
          return { ...b, items }
        })))

    case 'addTodo':
    case 'addNote': {
      const at = typeof a.after === 'number' ? a.after + 1 : null
      let focusKey: string | null = null
      const pages = mapPage(state.pages, a.pageId, (p) =>
        mapBlock(p, a.blockId, (b) => {
          if (a.type === 'addTodo' && b.type !== 'todo') return b
          if (a.type === 'addNote' && b.type !== 'notes') return b
          const items = (b as { items: unknown[] }).items.slice()
          const pos = at === null ? items.length : at
          items.splice(pos, 0, a.type === 'addTodo' ? { text: '', done: false } : { text: '' })
          focusKey = a.blockId + ':' + pos
          return { ...b, items } as Block
        }))
      return setPages(pages, focusKey)
    }

    case 'removeTodoItem':
    case 'removeNoteItem': {
      let focusKey: string | null = null
      const pages = mapPage(state.pages, a.pageId, (p) =>
        mapBlock(p, a.blockId, (b) => {
          if (b.type !== 'todo' && b.type !== 'notes') return b
          if (b.items.length <= 1) return b
          const items = b.items.slice()
          items.splice(a.index, 1)
          focusKey = a.blockId + ':' + Math.max(0, a.index - 1)
          return { ...b, items } as Block
        }))
      return setPages(pages, focusKey)
    }

    case 'addBlock': {
      const nb = newBlock(a.blockType)
      const focusKey = nb.type === 'todo' || nb.type === 'notes' ? nb.id + ':0' : null
      const pages = mapPage(state.pages, a.pageId, (p) => ({ ...p, blocks: [...(p.blocks || []), nb] }))
      return setPages(pages, focusKey)
    }

    case 'removeBlock':
      return setPages(mapPage(state.pages, a.pageId, (p) => ({
        ...p, blocks: (p.blocks || []).filter((bl) => bl.id !== a.blockId),
      })))

    case 'addSticker':
      return setPages(mapPage(state.pages, a.pageId, (p) => {
        const list = (p.stickers || []).slice()
        const n = list.length
        list.push({
          id: nid(), kind: a.kind, size: BIG_STICKERS.indexOf(a.kind) >= 0 ? 178 : 108,
          x: Math.round(52 + (n % 3) * 78 + (Math.random() * 12 - 6)),
          y: Math.round(96 + (n % 4) * 66 + (Math.random() * 12 - 6)),
          rot: Math.round(Math.random() * 16 - 8),
        })
        return { ...p, stickers: list }
      }))

    case 'moveSticker':
      return setPages(mapPage(state.pages, a.pageId, (p) => ({
        ...p,
        stickers: (p.stickers || []).map((s) =>
          s.id === a.stickerId ? { ...s, x: Math.round(a.x), y: Math.round(a.y) } : s),
      })))

    case 'resizeSticker':
      return setPages(mapPage(state.pages, a.pageId, (p) => ({
        ...p,
        stickers: (p.stickers || []).map((s) =>
          s.id === a.stickerId ? { ...s, size: Math.round(a.size) } : s),
      })))

    case 'setPageBg':
      return setPages(mapPage(state.pages, a.pageId, (p) => ({ ...p, bg: a.value })))

    case 'setPageInk':
      return setPages(mapPage(state.pages, a.pageId, (p) => ({ ...p, ink: a.value })))

    case 'setBlockColor':
      return setPages(mapPage(state.pages, a.pageId, (p) =>
        mapBlock(p, a.blockId, (b) => ({ ...b, color: a.value }))))

    case 'removeSticker':
      return setPages(mapPage(state.pages, a.pageId, (p) => ({
        ...p, stickers: (p.stickers || []).filter((s) => s.id !== a.stickerId),
      })))

    default:
      return state
  }
}

export function journalReducer(state: JournalState, action: JournalAction): JournalState {
  switch (action.type) {
    case 'merge':
      return { ...state, ...action.patch }
    case 'mergeIfView':
      return state.view === action.view ? { ...state, ...action.patch } : state
    case 'flipEnd': {
      if (!state.flip) return state
      const delta = state.flip.dir === 'next' ? 1 : -1
      return { ...state, spread: state.spread + delta, flip: null }
    }
    case 'toggleSound':
      return { ...state, soundOn: !state.soundOn }
    case 'toggleToolsOpen':
      return { ...state, toolsOpen: state.toolsOpen === action.which ? null : action.which }
    case 'clearFocusKey':
      return state.focusKey === action.key ? { ...state, focusKey: null } : state
    default:
      return docReducer(state, action)
  }
}
