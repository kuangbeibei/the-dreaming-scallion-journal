import type { CSSProperties } from 'react'
import type { Page } from '../types'
import JournalPage from './JournalPage'

interface Props {
  leafStyle: CSSProperties
  frontStyle: CSSProperties
  backStyle: CSSProperties
  hintStyle: CSSProperties
  coverPage: Page | null
  coverFolio: number | null
  onClick: () => void
}

/** The hinged cover: front = illustration, back = the first page. */
export default function CoverLeaf({ leafStyle, frontStyle, backStyle, hintStyle, coverPage, coverFolio, onClick }: Props) {
  return (
    <div style={leafStyle} onClick={onClick}>
      {/* front — illustrated cover */}
      <div style={frontStyle}>
        <img src="assets/cover.png" alt="The Dreaming Scallion" className="absolute inset-0 block h-full w-full object-cover" />
        <div className="absolute bottom-0 left-0 top-0 w-[20px]" style={{ background: 'linear-gradient(90deg,rgba(10,14,40,0.42),rgba(10,14,40,0))' }} />
        <div className="pointer-events-none absolute inset-0 rounded-[2px_11px_11px_2px]" style={{ boxShadow: 'inset 0 0 42px rgba(18,22,58,0.38)' }} />
        <div style={hintStyle}>
          <span className="inline-block rounded-[20px] bg-[rgba(18,22,55,0.5)] px-[15px] py-[6px] font-type text-[14px] tracking-[2px] text-[#fbf4de] shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
            tap to open ›
          </span>
        </div>
      </div>
      {/* back — inside cover = the first page */}
      <div style={backStyle}>
        <JournalPage page={coverPage} readonly folio={coverFolio} side="left" />
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 w-[20px]" style={{ background: 'linear-gradient(270deg,rgba(24,28,60,0.26),rgba(24,28,60,0))' }} />
      </div>
    </div>
  )
}
