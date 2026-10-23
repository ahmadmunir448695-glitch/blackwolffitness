/**
 * Cursor spotlight for cards: one passive pointer listener sets --mx / --my
 * on the nearest .fx-spot / .fx-glow element, which CSS turns into a soft
 * orange light that follows the pointer.
 */
export function installSpotlight() {
  if (typeof window === 'undefined') return
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
  document.addEventListener(
    'pointermove',
    (event) => {
      const el = event.target instanceof Element ? event.target.closest('.fx-spot, .fx-glow') : null
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${event.clientX - r.left}px`)
      el.style.setProperty('--my', `${event.clientY - r.top}px`)
    },
    { passive: true },
  )
}
