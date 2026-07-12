import type { CSSProperties } from 'react'

export interface TabVM {
  key: string
  label: string
  style: CSSProperties
  onClick: () => void
}

interface Props {
  tabs: TabVM[]
}

/** The colored section tabs down the right edge of the book. */
export default function SectionTabs({ tabs }: Props) {
  return (
    <>
      {tabs.map((tab) => (
        <button key={tab.key} onClick={tab.onClick} style={tab.style}>
          {tab.label}
        </button>
      ))}
    </>
  )
}
