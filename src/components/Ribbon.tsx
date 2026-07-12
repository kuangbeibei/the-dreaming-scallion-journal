import type { CSSProperties } from 'react'

interface Props {
  style: CSSProperties
  onClick: () => void
}

/** Silk bookmark ribbon dangling from the spine when the current spread is marked. */
export default function Ribbon({ style, onClick }: Props) {
  return (
    <div onClick={onClick} title="bookmark" style={style}>
      <div
        className="h-full w-full shadow-[0_3px_9px_rgba(0,0,0,0.26)]"
        style={{
          background: 'linear-gradient(90deg,#a94e67,#e7899d 42%,#cf7387 58%,#a94e67)',
          clipPath: 'polygon(0 0,100% 0,100% 100%,50% 80%,0 100%)',
        }}
      />
    </div>
  )
}
