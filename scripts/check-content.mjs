/**
 * `npm run check:content` — lists the business information the site still
 * needs before launch (contact details, prices, schedule, coach profiles…).
 * Nothing is changed; this only reports.
 */
import { club } from '../src/config/club.js'
import { coaches } from '../src/data/mock/coaches.js'
import { membershipPlans } from '../src/data/mock/memberships.js'
import { schedule } from '../src/data/mock/schedule.js'
import { testimonials } from '../src/data/mock/testimonials.js'
import { about } from '../src/data/content.js'
import { programs } from '../src/data/mock/programs.js'

const missing = []
const add = (file, what) => missing.push({ file, what })

const cfg = 'src/config/club.js'
if (!club.contact.phone) add(cfg, 'contact.phone')
if (!club.contact.whatsapp) add(cfg, 'contact.whatsapp (WhatsApp buttons are hidden until set)')
if (!club.contact.email) add(cfg, 'contact.email')
if (!club.location.addressLines.length) add(cfg, 'location.addressLines')
if (!club.location.city) add(cfg, 'location.city (also adds the city to page titles for local search)')
if (!club.location.mapEmbedUrl) add(cfg, 'location.mapEmbedUrl')
if (!club.location.mapLink) add(cfg, 'location.mapLink')
if (!club.hours.length) add(cfg, 'hours')
if (!Object.values(club.socials).some(Boolean)) add(cfg, 'socials (none set)')

coaches.filter((c) => c.placeholder).forEach((c) => add('src/data/mock/coaches.js', `coach "${c.slug}" is a placeholder`))
membershipPlans.filter((p) => p.placeholder || p.price === null).forEach((p) => add('src/data/mock/memberships.js', `plan "${p.id}" has no confirmed price`))
if (!schedule.length) add('src/data/mock/schedule.js', 'no class times published')
if (!testimonials.some((t) => !t.placeholder)) add('src/data/mock/testimonials.js', 'no real testimonials (section hidden on the live site)')
if (!about.story) add('src/data/content.js', 'about.story')

programs.forEach((p) => {
  p.sections
    .filter((s) => s.type === 'ageGroups')
    .forEach((s) => s.groups.filter((g) => !g.ages).forEach((g) => add('src/data/mock/programs.js', `${p.slug}: ages for "${g.name}"`)))
  p.sections
    .filter((s) => s.type === 'safety')
    .forEach((s) => (s.details ?? []).filter((d) => !d.value).forEach((d) => add('src/data/mock/programs.js', `${p.slug}: safety detail "${d.label}"`)))
})

const env = process.env
if (!env.VITE_API_BASE_URL) console.log('Note: VITE_API_BASE_URL is not set — the site uses mock data and forms cannot send.\n')

if (!missing.length) {
  console.log('All business content is filled in.')
} else {
  console.log(`${missing.length} items still need real information:\n`)
  let last = ''
  for (const { file, what } of missing) {
    if (file !== last) {
      console.log(`  ${file}`)
      last = file
    }
    console.log(`    - ${what}`)
  }
}
