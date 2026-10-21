import { programCatalog as programs } from '@/services/catalog.js'

/**
 * Site navigation. Program links come from the program list so the menu,
 * footer and cards always match. Menus use the static catalog
 * (src/services/catalog.js) so they render instantly, before any API call.
 */
export const programLinks = programs.map((program) => ({
  label: program.name,
  shortLabel: program.shortName ?? program.name,
  to: `/services/${program.slug}`,
  description: program.tagline,
  featured: Boolean(program.featured),
}))

export const mainNav = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Services', to: '/services', children: programLinks },
  { label: 'Special Kids', to: '/services/special-kids-training', highlight: true },
  { label: 'Coaches', to: '/coaches' },
  { label: 'Membership', to: '/membership' },
  { label: 'Contact Us', to: '/contact' },
]

export const joinLink = { label: 'Join Now', to: '/membership' }
