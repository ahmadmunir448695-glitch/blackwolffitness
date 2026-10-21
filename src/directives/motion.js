/**
 * ============================================================================
 *  MOTION DIRECTIVES — registered globally in main.js.
 *
 *  v-reveal               fade + rise into view when scrolled to (once)
 *  v-reveal="'left'"      variants: up (default) | left | right | scale | clip | blur
 *  v-reveal="{ variant: 'up', delay: 120 }"   delay in ms
 *  v-reveal-stagger       on a list: each direct child reveals 80ms apart
 *  v-parallax="0.15"      element drifts at 15% of scroll speed (desktop only)
 *
 *  Everything is skipped when the visitor prefers reduced motion, and content
 *  is never hidden unless IntersectionObserver is available to reveal it.
 * ============================================================================
 */

const canAnimate =
  typeof window !== 'undefined' &&
  'IntersectionObserver' in window &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches

let observer = null
function getObserver() {
  if (observer) return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target
        el.classList.add('is-revealed')
        observer.unobserve(el)
        // Once settled, drop the reveal transition so hover effects stay snappy.
        setTimeout(() => {
          el.classList.remove('reveal', `reveal-${el._revealVariant}`, 'is-revealed')
          el.style.removeProperty('--reveal-delay')
        }, (el._revealDelay ?? 0) + 1300)
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  )
  return observer
}

function parse(value) {
  if (typeof value === 'string') return { variant: value, delay: 0 }
  if (typeof value === 'number') return { variant: 'up', delay: value }
  return { variant: value?.variant ?? 'up', delay: value?.delay ?? 0 }
}

function prepare(el, variant, delay) {
  el._revealVariant = variant
  el._revealDelay = delay
  el.classList.add('reveal', `reveal-${variant}`)
  if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`)
  getObserver().observe(el)
}

export const reveal = {
  mounted(el, binding) {
    if (!canAnimate) return
    const { variant, delay } = parse(binding.value)
    prepare(el, variant, delay)
  },
  unmounted(el) {
    observer?.unobserve(el)
  },
}

export const revealStagger = {
  mounted(el, binding) {
    if (!canAnimate) return
    const { variant, delay } = parse(binding.value)
    const step = binding.arg ? Number(binding.arg) : 80
    ;[...el.children].forEach((child, i) => prepare(child, variant, delay + Math.min(i, 8) * step))
  },
  updated(el, binding) {
    if (!canAnimate) return
    const { variant, delay } = parse(binding.value)
    ;[...el.children].forEach((child, i) => {
      if (child._revealVariant) return
      prepare(child, variant, delay + Math.min(i, 8) * 80)
    })
  },
}

/**
 * v-reveal-auto on a <section>: reveals the blocks inside its container one
 * after another, and staggers card grids (ul.grid / ol.grid) item by item.
 * Lets long data-driven pages animate without touching every component.
 */
export const revealAuto = {
  mounted(el) {
    if (!canAnimate) return
    requestAnimationFrame(() => {
      const blocks = [...el.querySelectorAll(':scope > * > *')].filter((b) => !b._revealVariant)
      blocks.slice(0, 8).forEach((b, i) => prepare(b, 'up', Math.min(i, 4) * 90))
      el.querySelectorAll('ul.grid:not(.bg-line), ol.grid:not(.bg-line)').forEach((list) => {
        ;[...list.children].forEach((item, i) => {
          if (!item._revealVariant) prepare(item, 'up', 120 + Math.min(i, 8) * 80)
        })
      })
    })
  },
}

/* Parallax: one shared rAF loop for every element. */
const parallaxEls = new Set()
let ticking = false
function updateParallax() {
  ticking = false
  const vh = window.innerHeight
  for (const el of parallaxEls) {
    const rect = el.parentElement?.getBoundingClientRect() ?? el.getBoundingClientRect()
    if (rect.bottom < -200 || rect.top > vh + 200) continue
    const centre = rect.top + rect.height / 2 - vh / 2
    el.style.transform = `translate3d(0, ${(-centre * el._speed).toFixed(1)}px, 0)`
  }
}
function requestParallax() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(updateParallax)
}

export const parallax = {
  mounted(el, binding) {
    if (!canAnimate || !window.matchMedia('(min-width: 768px)').matches) return
    el._speed = Number(binding.value ?? 0.12)
    el.style.willChange = 'transform'
    if (!parallaxEls.size) {
      window.addEventListener('scroll', requestParallax, { passive: true })
      window.addEventListener('resize', requestParallax, { passive: true })
    }
    parallaxEls.add(el)
    requestParallax()
  },
  unmounted(el) {
    parallaxEls.delete(el)
    if (!parallaxEls.size) {
      window.removeEventListener('scroll', requestParallax)
      window.removeEventListener('resize', requestParallax)
    }
  },
}

export function installMotion(app) {
  app.directive('reveal', reveal)
  app.directive('reveal-stagger', revealStagger)
  app.directive('reveal-auto', revealAuto)
  app.directive('parallax', parallax)
}
