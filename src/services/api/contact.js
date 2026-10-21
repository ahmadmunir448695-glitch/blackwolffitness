import { isLive } from './config.js'
import { endpoints } from './endpoints.js'
import { ApiNotConfiguredError, request } from './client.js'

/**
 * Contact and trial-session submissions.
 *
 * There is deliberately NO mock for sending: until VITE_API_BASE_URL is set
 * (and `contact` is enabled in VITE_API_RESOURCES, if you use that list),
 * both functions throw ApiNotConfiguredError and the form tells the visitor
 * the message was not sent, offering WhatsApp / phone instead.
 *
 * Adjust `toPayload` to match the field names your API expects.
 */
export function toPayload(form, meta = {}) {
  return {
    name: form.name?.trim() ?? '',
    phone: form.phone?.trim() ?? '',
    email: form.email?.trim() ?? '',
    program: form.program ?? '',
    message: form.message?.trim() ?? '',
    child_name: form.childName?.trim() || undefined,
    child_age: form.childAge ? Number(form.childAge) : undefined,
    preferred_time: form.preferredTime?.trim() || undefined,
    topic: meta.topic ?? 'general',
    source_page: meta.sourcePage ?? '',
    // Honeypot: real visitors leave this empty. Let the API discard spam.
    website: form.website ?? '',
  }
}

export async function sendContactMessage(form, meta = {}, { signal } = {}) {
  if (!isLive('contact')) throw new ApiNotConfiguredError('contact')
  return request(endpoints.contact.message, { method: 'POST', body: toPayload(form, meta), signal })
}

export async function requestTrialSession(form, meta = {}, { signal } = {}) {
  if (!isLive('contact')) throw new ApiNotConfiguredError('contact')
  return request(endpoints.contact.trial, { method: 'POST', body: toPayload(form, { topic: 'trial', ...meta }), signal })
}
