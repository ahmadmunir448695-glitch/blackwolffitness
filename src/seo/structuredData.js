import { club } from '../config/club.js'

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
    data.url = siteUrl
    data.image = `${siteUrl}/og-image.png`
    data.logo = `${siteUrl}/apple-touch-icon.png`
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
  return data
}
