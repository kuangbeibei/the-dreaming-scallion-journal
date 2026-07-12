import type { Block, Decoration, Page, Section } from '../types'
import { nid } from './id'

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never
const b = (o: DistributiveOmit<Block, 'id'>): Block => ({ id: nid(), ...o } as Block)

const washi = (top: number, left: number, color: string, rot: number): Decoration => ({
  style: {
    position: 'absolute',
    top: top + 'px',
    left: left + 'px',
    width: '124px',
    height: '32px',
    background: color,
    transform: 'rotate(' + rot + 'deg)',
    boxShadow: '0 2px 7px rgba(0,0,0,0.1)',
    backgroundImage:
      'repeating-linear-gradient(90deg, rgba(255,255,255,0.22) 0 7px, rgba(255,255,255,0) 7px 14px)',
    pointerEvents: 'none',
  },
})

/** Initial journal contents used when nothing is saved in localStorage. */
export function makeSeed(): { pages: Page[]; sections: Section[] } {
  const sections: Section[] = [
    { id: 's-todo', title: 'To-Do', color: '#7fa86a' },
    { id: 's-diary', title: 'Diary', color: '#d0a94e' },
  ]

  const pages: Page[] = [
    {
      id: nid(), sectionId: 's-todo', date: 'Mon · 06 Jul',
      blocks: [
        b({ type: 'heading', text: 'This week' }),
        b({ type: 'todo', items: [
          { text: 'Water the plants', done: true },
          { text: 'Reply to Sam about the trip', done: false },
          { text: 'Book the dentist', done: false },
          { text: 'Finish the mood board', done: false },
        ] }),
      ],
      stickers: [{ id: nid(), kind: 'sun', x: 374, y: 250, rot: -7 }],
    },
    {
      id: nid(), sectionId: 's-todo', date: null,
      blocks: [
        b({ type: 'heading', text: 'Errands' }),
        b({ type: 'todo', items: [
          { text: 'Post office — send parcel', done: true },
          { text: 'Pick up dry cleaning', done: false },
          { text: 'Buy stamps + envelopes', done: false },
        ] }),
        b({ type: 'divider' }),
        b({ type: 'notes', items: [{ text: 'Call the landlord re: the lease' }] }),
      ],
    },
    {
      id: nid(), sectionId: 's-diary', date: 'Tue · 07 Jul',
      decorations: [washi(-10, 44, 'rgba(208,169,78,0.42)', -6)],
      blocks: [
        b({ type: 'heading', text: 'Morning pages' }),
        b({ type: 'text', body: 'Three things I noticed today: the light coming through the kitchen window, coffee gone cold again, and the exact moment the rain started.' }),
      ],
      stickers: [
        { id: nid(), kind: 'heart', x: 372, y: 300, rot: 8 },
      ],
    },
    {
      id: nid(), sectionId: 's-diary', date: 'Wed · 08 Jul',
      decorations: [washi(-9, 60, 'rgba(208,169,78,0.34)', -5)],
      blocks: [
        b({ type: 'heading', text: 'A quiet evening' }),
        b({ type: 'text', body: 'A small studio with north light. A long wooden table. Far too many plants, and no apologies for it. That is the dream, anyway — tonight it was tea and a half-read book.' }),
      ],
      stickers: [
        { id: nid(), kind: 'scallion', x: 64, y: 306, rot: 5 },
        { id: nid(), kind: 'moon', x: 384, y: 92, rot: -8 },
      ],
    },
  ]

  return { pages, sections }
}
