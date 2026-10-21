/** '18:30' → '6:30 pm' */
export function formatTime(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? '').trim())
  if (!match) return value ?? ''
  const hours = Number(match[1])
  const suffix = hours >= 12 ? 'pm' : 'am'
  const h12 = hours % 12 === 0 ? 12 : hours % 12
  return `${h12}:${match[2]} ${suffix}`
}

/** 8000, 'PKR' → 'PKR 8,000' */
export function formatPrice(price, currency = 'PKR') {
  if (price === null || price === undefined || Number.isNaN(Number(price))) return ''
  return `${currency} ${Number(price).toLocaleString('en-US')}`
}

export function telHref(phone) {
  const cleaned = String(phone ?? '').replace(/[^\d+]/g, '')
  return cleaned ? `tel:${cleaned}` : ''
}
