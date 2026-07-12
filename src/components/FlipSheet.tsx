import type { CSSProperties } from 'react'
import type { Page, Side } from '../types'
import JournalPage from './JournalPage'

interface Props {
  sheetStyle: CSSProperties
  faceFrontStyle: CSSProperties
  faceBackStyle: CSSProperties
  frontShadeStyle: CSSProperties
  backShadeStyle: CSSProperties
  front: Page | null
  back: Page | null
  frontFolio: number | null
  backFolio: number | null
  frontSide: Side
  backSide: Side
}

/** The turning sheet during a page flip. Its 3D rotation is driven imperatively
 *  via the Web Animations API (see useJournal.scheduleFlip), keyed by the
 *  data-flip-sheet / data-flip-shade attributes. */
export default function FlipSheet({
  sheetStyle, faceFrontStyle, faceBackStyle, frontShadeStyle, backShadeStyle,
  front, back, frontFolio, backFolio, frontSide, backSide,
}: Props) {
  return (
    <div style={sheetStyle} data-flip-sheet="1">
      <div style={faceFrontStyle}>
        <JournalPage page={front} readonly folio={frontFolio} side={frontSide} />
        <div style={frontShadeStyle} data-flip-shade="1" />
      </div>
      <div style={faceBackStyle}>
        <JournalPage page={back} readonly folio={backFolio} side={backSide} />
        <div style={backShadeStyle} />
      </div>
    </div>
  )
}
