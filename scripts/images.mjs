/**
 * Photo tools for src/data/media.js.
 *
 *   npm run images:check     check every Unsplash photo still loads (nothing changes)
 *   npm run images:download  save every photo to public/images/<name>.jpg
 *   npm run images:selfhost  download, then point media.js at the local files
 *
 * Self-hosting means the site no longer depends on Unsplash at runtime.
 * Swap any file in public/images/ for the club's own photo with the same name.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { media } from '../src/data/media.js'

const mode = process.argv[2] ?? 'check' // check | download | selfhost
const root = new URL('..', import.meta.url)
const outDir = new URL('public/images/', root)
const mediaFile = new URL('src/data/media.js', root)

const entries = Object.entries(media).filter(([, m]) => m.src.startsWith('https://images.unsplash.com/'))
if (!entries.length) {
  console.log('No Unsplash photos left in media.js — nothing to do.')
  process.exit(0)
}
if (mode !== 'check') await mkdir(outDir, { recursive: true })

let failed = 0
for (const [name, item] of entries) {
  const url = `${item.src}?w=2000&q=78&fm=jpg&fit=crop`
  try {
    const res = await fetch(url, { method: mode === 'check' ? 'HEAD' : 'GET' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    if (mode !== 'check') {
      const file = new URL(`${name}.jpg`, outDir)
      await writeFile(file, Buffer.from(await res.arrayBuffer()))
    }
    console.log(`  ok   ${name}`)
  } catch (err) {
    failed++
    console.log(`  FAIL ${name}  ${item.src}  (${err.message})`)
  }
}

if (mode === 'selfhost') {
  let source = await readFile(mediaFile, 'utf8')
  for (const [name, item] of entries) {
    const id = item.src.split('/').pop()
    if (!existsSync(new URL(`${name}.jpg`, outDir))) continue
    source = source.replace(`src: unsplash('${id}')`, `src: '/images/${name}.jpg'`)
  }
  await writeFile(mediaFile, source)
  console.log('\nmedia.js now points at /images/… for every photo that downloaded.')
}

console.log(`\n${entries.length - failed} of ${entries.length} photos OK.`)
if (failed) {
  console.log('Replace failed photos in src/data/media.js (or add your own to public/images/).')
  process.exitCode = 1
}
