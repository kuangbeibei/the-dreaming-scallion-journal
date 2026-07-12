import type { DividerBlock as DividerBlockModel } from '../../types'
import { hexToRgba } from '../../lib/color'

interface Props {
  block: DividerBlockModel
}

export default function DividerBlock({ block }: Props) {
  const bc = block.color || '#3a3730'
  const lineStyle = { borderBottom: '2px dashed ' + hexToRgba(bc, 0.42) }
  return (
    <div className="flex items-center gap-3 py-2" style={{ color: hexToRgba(bc, 0.5) }}>
      <div className="h-0 flex-1" style={lineStyle} />
      <span className="font-type text-[20px]">✦</span>
      <div className="h-0 flex-1" style={lineStyle} />
    </div>
  )
}
