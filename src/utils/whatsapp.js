import { club } from '@/config/club.js'

/**
 * Digits in international format, e.g. '+92 300-1234567' → '923001234567'.
 * Pakistani local numbers are converted too: '0300 1234567' → '923001234567'.
 */
export function normaliseWhatsAppNumber(value) {
  let digits = String(value ?? '').replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  else if (/^03\d{9}$/.test(digits)) digits = `92${digits.slice(1)}`
  return digits
}

export function isWhatsAppConfigured(number = club.contact.whatsapp) {
  return normaliseWhatsAppNumber(number).length >= 8
}

/**
 * Build a wa.me click-to-chat link, or null when no number is configured
 * (callers hide the button rather than link somewhere broken).
 */
export function whatsappUrl(message = club.contact.whatsappGreeting, number = club.contact.whatsapp) {
  const digits = normaliseWhatsAppNumber(number)
  if (digits.length < 8) return null
  const text = String(message ?? '').trim()
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

/** Compose a readable WhatsApp message from a form the API could not send. */
export function messageFromForm(form, { programName = '', heading = 'New inquiry from the website' } = {}) {
  const lines = [heading, '']
  if (form.name) lines.push(`Name: ${form.name.trim()}`)
  if (form.childName) lines.push(`Child: ${form.childName.trim()}${form.childAge ? ` (age ${form.childAge})` : ''}`)
  if (form.phone) lines.push(`Phone: ${form.phone.trim()}`)
  if (form.email) lines.push(`Email: ${form.email.trim()}`)
  if (programName) lines.push(`Program: ${programName}`)
  if (form.preferredTime) lines.push(`Preferred time: ${form.preferredTime.trim()}`)
  if (form.message) lines.push('', form.message.trim())
  return lines.join('\n')
}
