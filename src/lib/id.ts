/** Short, collision-resistant id for pages/blocks/stickers. */
export function nid(): string {
  return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}
