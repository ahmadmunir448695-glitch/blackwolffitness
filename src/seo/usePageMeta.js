import { DEFAULT_IMAGE, SITE_NAME, fullTitle } from './pages.js'

const SITE_URL = String(import.meta.env.VITE_SITE_URL ?? '').replace(/\/+$/, '')

function absolute(url) {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url
  return SITE_URL ? `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}` : url
}

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!content) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!href) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Apply title, description, Open Graph, Twitter and canonical tags.
 * @param {{ title?: string, description?: string, image?: string, path?: string, noindex?: boolean }} page
 */
export function applyPageMeta(page = {}) {
  if (typeof document === 'undefined') return
  const title = fullTitle(page.title)
  const url = page.path !== undefined ? absolute(page.path) : ''
  const image = absolute(page.image || DEFAULT_IMAGE)

  document.title = title
  setMeta('name', 'description', page.description)
  setMeta('name', 'robots', page.noindex ? 'noindex, follow' : '')
  setMeta('property', 'og:type', 'website')
  setMeta('property', 'og:site_name', SITE_NAME)
  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', page.description)
  setMeta('property', 'og:image', image)
  setMeta('property', 'og:url', url)
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', page.description)
  setMeta('name', 'twitter:image', image)
  setCanonical(SITE_URL && page.path !== undefined && !page.noindex ? url : '')
}

/** Inject (or replace) a JSON-LD block by id. */
export function applyJsonLd(id, data) {
  if (typeof document === 'undefined') return
  let el = document.getElementById(id)
  if (!data) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

export const siteUrl = SITE_URL
