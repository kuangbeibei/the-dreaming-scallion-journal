export type BlockType = 'heading' | 'text' | 'divider' | 'todo' | 'notes'

export interface HeadingBlock {
  id: string
  type: 'heading'
  text: string
  color?: string
}

export interface TextBlock {
  id: string
  type: 'text'
  body: string
  color?: string
}

export interface DividerBlock {
  id: string
  type: 'divider'
  color?: string
}

export interface TodoItem {
  text: string
  done: boolean
}

export interface TodoBlock {
  id: string
  type: 'todo'
  items: TodoItem[]
  color?: string
}

export interface NoteItem {
  text: string
}

export interface NotesBlock {
  id: string
  type: 'notes'
  items: NoteItem[]
  color?: string
}

export type Block = HeadingBlock | TextBlock | DividerBlock | TodoBlock | NotesBlock

export interface Sticker {
  id: string
  kind: string
  x: number
  y: number
  rot: number
  size?: number
}

export interface Decoration {
  style: React.CSSProperties
}

export interface Page {
  id: string
  sectionId: string | null
  date?: string | null
  blocks: Block[]
  stickers?: Sticker[]
  decorations?: Decoration[]
  bg?: string
  ink?: string
}

export interface Section {
  id: string
  title: string
  color: string
}

/** The persisted document: everything saved to localStorage cache and the server. */
export interface JournalDoc {
  pages: Page[]
  sections: Section[]
  bookmark: number | null
  soundOn: boolean
}

export type Side = 'left' | 'right'

/** Actions that mutate the persisted document (pages/sections/etc.). */
export type DocAction =
  | { type: 'focusBlock'; pageId: string | null; blockId: string | null }
  | { type: 'setHeading'; pageId: string; blockId: string; value: string }
  | { type: 'setText'; pageId: string; blockId: string; value: string }
  | { type: 'setDate'; pageId: string; value: string }
  | { type: 'toggleTodo'; pageId: string; blockId: string; index: number }
  | { type: 'setTodoText'; pageId: string; blockId: string; index: number; value: string }
  | { type: 'setNoteText'; pageId: string; blockId: string; index: number; value: string }
  | { type: 'addTodo'; pageId: string; blockId: string; after?: number }
  | { type: 'addNote'; pageId: string; blockId: string; after?: number }
  | { type: 'removeTodoItem'; pageId: string; blockId: string; index: number }
  | { type: 'removeNoteItem'; pageId: string; blockId: string; index: number }
  | { type: 'addBlock'; pageId: string; blockType: BlockType }
  | { type: 'removeBlock'; pageId: string; blockId: string }
  | { type: 'addSticker'; pageId: string; kind: string }
  | { type: 'moveSticker'; pageId: string; stickerId: string; x: number; y: number }
  | { type: 'resizeSticker'; pageId: string; stickerId: string; size: number }
  | { type: 'setPageBg'; pageId: string; value: string }
  | { type: 'setPageInk'; pageId: string; value: string }
  | { type: 'setBlockColor'; pageId: string; blockId: string; value: string }
  | { type: 'removeSticker'; pageId: string; stickerId: string }

export type Dispatch = (action: DocAction) => void
