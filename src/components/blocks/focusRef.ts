/**
 * Returns a ref callback that focuses an input/textarea (and moves the caret to
 * the end) when its `key` matches the journal's transient `focusKey`. Used so a
 * newly-added todo/note line receives focus.
 */
export function focusRef(focusKey: string | null | undefined, key: string) {
  return (node: HTMLInputElement | HTMLTextAreaElement | null) => {
    if (node && focusKey === key) {
      node.focus()
      try {
        const l = node.value.length
        node.setSelectionRange(l, l)
      } catch { /* not always settable */ }
    }
  }
}
