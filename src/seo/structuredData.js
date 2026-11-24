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
    '@type': ['SportsClub', 'ExerciseGym'],
    name: club.name,
    alternateName: ['Black Wolf', 'Blackwolffitnessclub', 'Black Wolf Fitness Club Lahore', 'Black Wolf Taekwondo Club'],
    description: club.summary,
    keywords:
      'fitness club Lahore, gym Bahria Town, taekwondo club Lahore, boxing club Lahore, MMA club Lahore, kickboxing Lahore, martial arts Bahria Town, special kids training Lahore',
  }
  if (siteUrl) {
    data['@id'] = `${siteUrl}/#club`
    data.url = siteUrl
    data.image = `${siteUrl}/og-image.jpg`
    data.logo = `${siteUrl}/logo-512.png`
  }
  if (contact.phone) {
    // International format (+92 …) so Google matches it to the Maps listing.
    data.telephone = location.country === 'PK' ? contact.phone.replace(/^0(\d{3})\s*/, '+92 $1 ') : contact.phone
  }
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
  if (location.geo) {
    data.geo = { '@type': 'GeoCoordinates', latitude: location.geo.latitude, longitude: location.geo.longitude }
  }
  if (location.mapLink) data.hasMap = location.mapLink
  if (location.areaServed?.length) {
    data.areaServed = location.areaServed.map((name) => ({ '@type': 'Place', name }))
  }
  data.knowsAbout = ['Taekwondo', 'Boxing', 'Kickboxing', 'Mixed Martial Arts', 'Fitness training', 'Gymnastics', 'Special needs kids training']
  const sameAs = [...Object.values(socials), location.mapLink].filter(Boolean)
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
 * schema.org WebSite, so Google shows "Black Wolf Fitness Club" as the
 * site name in search results.
 */
export function websiteJsonLd(siteUrl = '') {
  if (!siteUrl) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: club.name,
    alternateName: ['Black Wolf', 'Black Wolf Fitness'],
    url: `${siteUrl}/`,
  }
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
