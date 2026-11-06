import { club } from '../config/club.js'
import { prerenderSource } from '../services/catalog.js'

/** Coaches with real profiles (placeholders stay out of structured data). */
function realCoaches() {
  return (prerenderSource.coaches ?? []).filter((c) => !c.placeholder && c.name?.trim())
}

function coachUrl(coach, siteUrl) {
  return siteUrl ? `${siteUrl}/coaches/${coach.slug}` : undefined
}

/**
 * schema.org data for local search. Only fields the club has filled in are
 * included — nothing is invented, and no Google Business Profile is implied.
 */
export function organizationJsonLd(siteUrl = '') {
  const { contact, location, socials } = club
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name: club.name,
    description: club.summary,
  }
  if (siteUrl) {
    data['@id'] = `${siteUrl}/#club`
    data.url = siteUrl
    data.image = `${siteUrl}/og-image.png`
    data.logo = `${siteUrl}/logo-512.png`
  }
  if (contact.phone) data.telephone = contact.phone
  if (contact.email) data.email = contact.email
  if (location.addressLines.length || location.city) {
    data.address = {
      '@type': 'PostalAddress',
      ...(location.addressLines.length ? { streetAddress: location.addressLines.join(', ') } : {}),
      ...(location.city ? { addressLocality: location.city } : {}),
      ...(location.region ? { addressRegion: location.region } : {}),
      ...(location.postalCode ? { postalCode: location.postalCode } : {}),
      ...(location.country ? { addressCountry: location.country } : {}),
    }
  }
  if (location.mapLink) data.hasMap = location.mapLink
  const sameAs = Object.values(socials).filter(Boolean)
  if (sameAs.length) data.sameAs = sameAs
  const coaches = realCoaches()
  if (coaches.length) {
    data.employee = coaches.map((c) => ({
      '@type': 'Person',
      name: c.name,
      jobTitle: c.role,
      ...(coachUrl(c, siteUrl) ? { url: coachUrl(c, siteUrl) } : {}),
    }))
  }
  return data
}

/**
 * schema.org Person for a coach profile page, so a search for the coach's
 * name (or a name they are known by) can match this page.
 * @param {object} coach  coach record from src/data/mock/coaches.js or the API
 * @param {string} siteUrl  public site URL without trailing slash
 * @param {string} [imageUrl]  absolute photo URL, when known
 */
export function personJsonLd(coach, siteUrl = '', imageUrl = '') {
  if (!coach || coach.placeholder || !coach.name?.trim()) return null
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: coach.name,
    jobTitle: coach.role,
    worksFor: {
      '@type': 'SportsActivityLocation',
      name: club.name,
      ...(siteUrl ? { '@id': `${siteUrl}/#club`, url: siteUrl } : {}),
    },
  }
  const aka = (coach.alternateNames ?? []).filter(Boolean)
  if (aka.length) data.alternateName = aka
  if (coachUrl(coach, siteUrl)) data.url = coachUrl(coach, siteUrl)
  if (imageUrl) data.image = imageUrl
  if (coach.bio?.[0]) data.description = coach.bio[0]
  if (coach.specializations?.length) data.knowsAbout = coach.specializations
  if (coach.achievements?.length) data.award = coach.achievements
  if (coach.certifications?.length) {
    data.hasCredential = coach.certifications.map((name) => ({ '@type': 'EducationalOccupationalCredential', name }))
  }
  if (club.location.city) {
    data.workLocation = { '@type': 'Place', name: `${club.location.city}${club.location.country === 'PK' ? ', Pakistan' : ''}` }
  }
  return data
}
