/**
 * Runs after `vite build`.
 *
 * 1. Writes one HTML file per route (dist/services/boxing/index.html, …) with
 *    that page's title, description, canonical and Open Graph tags baked in.
 *    The app is still a single-page app; this only makes direct links,
 *    search engines and social previews (WhatsApp, Facebook) see the right
 *    metadata without running JavaScript.
 * 2. Writes dist/404.html (SPA fallback for hosts that use it).
 * 3. Writes robots.txt, and sitemap.xml when VITE_SITE_URL is set.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { allPages, fullTitle, DEFAULT_IMAGE, SITE_NAME } from '../src/seo/pages.js'
import { organizationJsonLd } from '../src/seo/structuredData.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const env = { ...loadEnv(process.env.NODE_ENV === 'development' ? 'development' : 'production', root, 'VITE_'), ...process.env }
const siteUrl = String(env.VITE_SITE_URL ?? '').trim().replace(/\/+$/, '')

const START = '<!-- bw:head:start'
const END = '<!-- bw:head:end -->'

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const absolute = (url) => {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url
  return siteUrl ? `${siteUrl}${url.startsWith('/') ? '' : '/'}${url}` : url
}

function headFor(page) {
  const title = fullTitle(page.title)
  const image = absolute(page.image || DEFAULT_IMAGE)
  const url = page.key === 'notFound' ? '' : absolute(page.path)
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    page.noindex ? '<meta name="robots" content="noindex, follow" />' : '',
    siteUrl && url && !page.noindex ? `<link rel="canonical" href="${escapeHtml(url)}" />` : '',
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    url ? `<meta property="og:url" content="${escapeHtml(url)}" />` : '',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    page.key === 'home' || page.key === 'contact'
      ? `<script type="application/ld+json" id="ld-organization">${JSON.stringify(organizationJsonLd(siteUrl)).replace(/</g, '\\u003c')}</script>`
      : '',
  ]
  return tags.filter(Boolean).join('\n    ')
}

function inject(template, head) {
  const start = template.indexOf(START)
  const end = template.indexOf(END)
  if (start === -1 || end === -1) throw new Error('Head markers not found in dist/index.html')
  return `${template.slice(0, start)}${head}${template.slice(end + END.length)}`
}

async function write(path, content) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, content)
}

const template = await readFile(join(dist, 'index.html'), 'utf8')
const pages = allPages()
let count = 0

for (const page of pages) {
  const html = inject(template, headFor(page))
  if (page.key === 'notFound') {
    await write(join(dist, '404.html'), html)
  } else if (page.path === '/') {
    await write(join(dist, 'index.html'), html)
  } else {
    await write(join(dist, page.path.replace(/^\//, ''), 'index.html'), html)
  }
  count += 1
}

const indexable = pages.filter((p) => !p.noindex && p.key !== 'notFound')
const robots = ['User-agent: *', 'Allow: /', siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml` : ''].filter(Boolean).join('\n')
await write(join(dist, 'robots.txt'), `${robots}\n`)

if (siteUrl) {
  const today = new Date().toISOString().slice(0, 10)
  const urls = indexable
    .map((p) => `  <url><loc>${escapeHtml(absolute(p.path))}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n')
  await write(
    join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  )
  console.log(`postbuild: ${count} pages with metadata, sitemap.xml (${indexable.length} URLs), robots.txt`)
} else {
  console.log(`postbuild: ${count} pages with metadata, robots.txt. Set VITE_SITE_URL to also generate sitemap.xml and canonical URLs.`)
}
