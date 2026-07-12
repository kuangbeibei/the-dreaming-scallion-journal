/** Convert a hex color (#rgb or #rrggbb) to an rgba() string at the given alpha. */
export function hexToRgba(h: string | undefined, alpha: number): string {
  const m = (h || '').replace('#', '')
  const v = m.length === 3 ? m.split('').map((c) => c + c).join('') : m
  const n = parseInt(v || '3a3730', 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

/** Case-insensitive hex equality. */
export function hexEq(a: string | undefined, b: string | undefined): boolean {
  return (a || '').toLowerCase() === (b || '').toLowerCase()
}
