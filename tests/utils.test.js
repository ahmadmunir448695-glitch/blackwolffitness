import { describe, expect, it } from 'vitest'
import { rules, validate } from '@/utils/validation.js'
import { messageFromForm, whatsappUrl } from '@/utils/whatsapp.js'
import { formatPrice, formatTime } from '@/utils/format.js'
import { programs } from '@/data/mock/programs.js'
import { allPages } from '@/seo/pages.js'
import { routes } from '@/router/index.js'

describe('validation', () => {
  const schema = { name: [rules.required('your name')], phone: [rules.required('a phone number'), rules.phone], email: [rules.email] }

  it('flags missing and malformed fields with helpful messages', () => {
    const { valid, errors } = validate({ name: '', phone: '123', email: 'nope' }, schema)
    expect(valid).toBe(false)
    expect(errors.name).toBe('Enter your name.')
    expect(errors.phone).toMatch(/too short/)
    expect(errors.email).toMatch(/name@example.com/)
  })

  it('accepts local and international phone formats', () => {
    expect(rules.phone('+92 300 1234567')).toBe('')
    expect(rules.phone('0300-1234567')).toBe('')
    expect(rules.phone('abc')).not.toBe('')
  })
})

describe('whatsapp', () => {
  it('returns null when no number is configured', () => {
    expect(whatsappUrl('hi', '')).toBeNull()
  })
  it('builds a wa.me link with an encoded message', () => {
    expect(whatsappUrl('Hi there', '+92 300 1234567')).toBe('https://wa.me/923001234567?text=Hi%20there')
  })
  it('converts Pakistani local numbers to international format', () => {
    expect(whatsappUrl('', '0305 4486950')).toBe('https://wa.me/923054486950')
    expect(whatsappUrl('', '0092 305 4486950')).toBe('https://wa.me/923054486950')
  })
  it('composes a message from form fields', () => {
    expect(messageFromForm({ name: 'Ali', phone: '0300', message: 'Hello' }, { programName: 'Boxing' })).toContain('Program: Boxing')
  })
})

describe('format', () => {
  it('formats times and prices', () => {
    expect(formatTime('18:30')).toBe('6:30 pm')
    expect(formatPrice(8000, 'PKR')).toBe('PKR 8,000')
    expect(formatPrice(null)).toBe('')
  })
})

describe('content integrity', () => {
  it('has unique program slugs, an image, FAQs and SEO for every program', () => {
    const slugs = programs.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    programs.forEach((p) => {
      expect(p.image?.src).toBeTruthy()
      expect(p.seo?.title && p.seo?.description).toBeTruthy()
      expect(p.sections.some((s) => s.type === 'faq')).toBe(true)
    })
  })

  it('gives every page a unique title and description', () => {
    const pages = allPages()
    expect(new Set(pages.map((p) => p.title)).size).toBe(pages.length)
    expect(new Set(pages.map((p) => p.description)).size).toBe(pages.length)
  })

  it('defines a 404 catch-all route', () => {
    expect(routes.at(-1).name).toBe('not-found')
  })
})
