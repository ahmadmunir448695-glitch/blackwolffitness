/** Display helpers shared by portal pages. */

export const EVENT_STATUS = {
  upcoming: { label: 'Upcoming', tone: 'info' },
  registration_open: { label: 'Registration Open', tone: 'success' },
  registration_closed: { label: 'Registration Closed', tone: 'warning' },
  ongoing: { label: 'Ongoing', tone: 'ember' },
  completed: { label: 'Completed', tone: 'muted' },
}

export const ENTRY_STATUS = {
  draft: { label: 'Draft', tone: 'muted' },
  submitted: { label: 'Submitted', tone: 'info' },
  under_review: { label: 'Under Review', tone: 'ember' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  correction_required: { label: 'Correction Required', tone: 'warning' },
  cancelled: { label: 'Cancelled', tone: 'muted' },
}

export const PAYMENT_STATUS = {
  unpaid: { label: 'Unpaid', tone: 'warning' },
  pending: { label: 'Payment Pending', tone: 'info' },
  paid: { label: 'Paid', tone: 'success' },
  waived: { label: 'No Fee', tone: 'muted' },
  refunded: { label: 'Refunded', tone: 'muted' },
  rejected: { label: 'Rejected', tone: 'danger' },
}

export const DISCIPLINE_LABELS = {
  kyorugi: 'Kyorugi',
  poomsae: 'Poomsae',
  breaking: 'Breaking',
  demonstration: 'Team Demonstration',
}

export const DOC_KINDS = {
  medical: 'Medical certificate',
  id_document: 'ID / Passport',
  photo: 'Photo',
  certificate: 'Certificate',
  payment_proof: 'Payment receipt',
  other: 'Other',
}

const DATE_FMT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const DATETIME_FMT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/** '2027-01-15' → '15 Jan 2027' */
export function fmtDate(value) {
  if (!value) return ''
  const d = new Date(value.length === 10 ? `${value}T00:00:00Z` : value)
  return Number.isNaN(d.getTime()) ? value : DATE_FMT.format(d)
}

export function fmtDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : DATETIME_FMT.format(d)
}

export function fmtRange(start, end) {
  if (!start) return ''
  if (!end || start === end) return fmtDate(start)
  const [sy, sm] = start.split('-')
  const [ey, em] = end.split('-')
  if (sy === ey && sm === em) return `${Number(start.slice(8))}–${fmtDate(end)}`
  return `${fmtDate(start)} – ${fmtDate(end)}`
}

export function fmtMoney(amount, currency = 'PKR') {
  if (amount === null || amount === undefined || amount === '') return '—'
  return `${currency} ${Number(amount).toLocaleString('en-US')}`
}

export function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function relativeTime(value) {
  const then = new Date(value).getTime()
  const diff = (Date.now() - then) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d ago`
  return fmtDate(value)
}

/** Days from today until a 'YYYY-MM-DD' date (negative when past). */
export function daysUntil(date) {
  if (!date) return null
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z')
  return Math.round((new Date(`${date}T00:00:00Z`) - today) / 86400000)
}

export function humanize(value) {
  return String(value ?? '')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
}

/** Competition age by the event's rule; mirrors the server. */
export function competitionAge(dob, event) {
  if (!dob || !event) return null
  const ref = event.age_reference_date || event.start_date
  const [by, bm, bd] = dob.split('-').map(Number)
  const [ry, rm, rd] = ref.split('-').map(Number)
  if (event.age_method === 'birth_year') return ry - by
  let age = ry - by
  if (rm < bm || (rm === bm && rd < bd)) age--
  return age
}

export function initials(name) {
  return String(name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}
